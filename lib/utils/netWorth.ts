import type { HistoryPoint } from "@/lib/services/marketData";
import type {
  Account,
  Holding,
  HoldingValuation,
  Transaction,
} from "@/lib/types";

export interface NetWorthPoint {
  monthKey: string;
  // All USD. `liabilities` is a positive number (what's owed).
  cash: number;
  investments: number;
  liabilities: number;
  netWorth: number;
  // True when some holding had no price for this month and fell back to
  // its cost basis.
  estimated: boolean;
}

export interface NetWorthInputs {
  accounts: Account[];
  transactions: Transaction[];
  holdings: Holding[];
  valuations: HoldingValuation[];
  // Daily/weekly closes per market symbol, oldest first.
  priceHistory: Record<string, HistoryPoint[]>;
  // Units of each currency per 1 USD, at today's rates.
  usdRates: Record<string, number>;
}

function monthEndISO(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${monthKey}-${String(last).padStart(2, "0")}`;
}

export function lastMonthKeys(count: number, from = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth() - (count - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

function accountDelta(t: Transaction): number {
  const amt = t.accountAmount ?? t.amount;
  if (t.type === "income") return amt;
  if (t.type === "expense" || t.type === "investment") return -amt;
  if (t.type === "transfer") return t.transferDirection === "in" ? amt : -amt;
  return 0;
}

function closeOnOrBefore(points: HistoryPoint[], iso: string): number | null {
  let found: number | null = null;
  for (const p of points) {
    if (p.date.slice(0, 10) <= iso) found = p.closeUSD;
    else break;
  }
  return found;
}

/**
 * Month-end net worth for each month key. Account balances are rebuilt from
 * transactions and converted to USD at today's rates, so a month's figure
 * moves only with what happened in the accounts, not with the exchange rate.
 * Investments use the month-end close (market) or the latest valuation
 * (manual), falling back to cost basis when neither exists.
 */
export function computeNetWorthSeries(
  monthKeys: string[],
  inputs: NetWorthInputs,
): NetWorthPoint[] {
  const { accounts, transactions, holdings, valuations, priceHistory, usdRates } =
    inputs;
  const toUsd = (amount: number, currency: string) => {
    if (currency === "USD") return amount;
    const rate = usdRates[currency];
    return rate ? amount / rate : 0;
  };

  // An installment purchase is owed in full from the day it was made, even
  // though its slices are dated across later months.
  const planStart = new Map<string, string>();
  for (const t of transactions) {
    const plan = t.installment?.planId;
    if (!plan) continue;
    const d = t.date.slice(0, 10);
    const known = planStart.get(plan);
    if (!known || d < known) planStart.set(plan, d);
  }
  const effectiveDate = (t: Transaction) =>
    t.installment ? (planStart.get(t.installment.planId) ?? t.date.slice(0, 10)) : t.date.slice(0, 10);

  const txByAccount = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const list = txByAccount.get(t.accountId) ?? [];
    list.push(t);
    txByAccount.set(t.accountId, list);
  }
  const holdingsById = new Map(holdings.map((h) => [h.id, h]));
  const sortedHistory: Record<string, HistoryPoint[]> = {};
  for (const [symbol, points] of Object.entries(priceHistory)) {
    sortedHistory[symbol] = [...points].sort((a, b) => a.date.localeCompare(b.date));
  }

  return monthKeys.map((monthKey) => {
    const end = monthEndISO(monthKey);
    let cash = 0;
    let liabilities = 0;

    for (const account of accounts) {
      const txs = (txByAccount.get(account.id) ?? []).filter(
        (t) => effectiveDate(t) <= end,
      );
      const existed = account.createdAt.slice(0, 10) <= end || txs.length > 0;
      if (!existed) continue;
      const balance = txs.reduce(
        (sum, t) => sum + accountDelta(t),
        account.initialBalance,
      );
      const usd = toUsd(balance, account.currency);
      if (account.type === "credit") liabilities += Math.max(0, -usd);
      else cash += usd;
    }

    let investments = 0;
    let estimated = false;
    const perHolding = new Map<string, { cost: number; shares: number }>();
    for (const h of holdings) {
      if (h.kind === "manual" && h.initialCostUSD && h.createdAt.slice(0, 10) <= end) {
        perHolding.set(h.id, { cost: h.initialCostUSD, shares: 0 });
      }
    }
    for (const t of transactions) {
      if (t.type !== "investment" || !t.holdingId || t.date.slice(0, 10) > end) continue;
      const pos = perHolding.get(t.holdingId) ?? { cost: 0, shares: 0 };
      pos.cost += t.amountUSD;
      pos.shares += t.sharesDelta ?? 0;
      perHolding.set(t.holdingId, pos);
    }
    for (const [holdingId, pos] of perHolding) {
      const holding = holdingsById.get(holdingId);
      if (holding?.kind === "manual") {
        let latest: HoldingValuation | undefined;
        for (const v of valuations) {
          if (v.holdingId !== holdingId || v.asOfDate.slice(0, 10) > end) continue;
          if (!latest || v.asOfDate > latest.asOfDate) latest = v;
        }
        if (latest) {
          investments += latest.valueUSD;
        } else {
          investments += pos.cost;
          if (pos.cost > 0) estimated = true;
        }
        continue;
      }
      const close =
        holding?.symbol && sortedHistory[holding.symbol]
          ? closeOnOrBefore(sortedHistory[holding.symbol], end)
          : null;
      if (close !== null && pos.shares > 0) {
        investments += pos.shares * close;
      } else {
        investments += pos.cost;
        if (pos.cost > 0) estimated = true;
      }
    }

    return {
      monthKey,
      cash,
      investments,
      liabilities,
      netWorth: cash + investments - liabilities,
      estimated,
    };
  });
}
