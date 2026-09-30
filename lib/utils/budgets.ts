import type { Budget, Transaction } from "@/lib/types";
import { spendSign } from "@/lib/utils/refunds";

export type BudgetStatus = "on-track" | "warning" | "over";

export interface BudgetProgress {
  spent: number;
  remaining: number;
  percent: number;
  status: BudgetStatus;
}

export interface BudgetTotals {
  totalCap: number;
  totalSpent: number;
  uncappedSpend: number;
}

// Units of each currency per 1 USD. USD itself is implied as 1.
export type UsdRates = Record<string, number>;

export function currentMonthKey(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  return `${now.getFullYear()}-${month < 10 ? `0${month}` : month}`;
}

export function monthKeyOf(dateISO: string): string {
  return dateISO.slice(0, 7);
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function usdRate(currency: string, usdRates: UsdRates): number | null {
  if (currency === "USD") return 1;
  const rate = usdRates[currency];
  return typeof rate === "number" && rate > 0 ? rate : null;
}

/**
 * Convert an amount between currencies through USD. Returns null while the
 * needed rate hasn't loaded, so callers can skip instead of mixing units.
 */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  usdRates: UsdRates,
): number | null {
  if (from === to) return amount;
  const fromRate = usdRate(from, usdRates);
  const toRate = usdRate(to, usdRates);
  if (fromRate === null || toRate === null) return null;
  return (amount / fromRate) * toRate;
}

/**
 * A transaction's value in `currency`. A transaction already in that currency
 * contributes its original amount, untouched by FX. USD targets use the stored
 * `amountUSD`; anything else converts that USD figure at today's rate.
 */
export function transactionAmountIn(
  t: Pick<Transaction, "amount" | "amountUSD" | "currency">,
  currency: string,
  usdRates: UsdRates,
): number | null {
  if (t.currency === currency) return t.amount;
  return convertAmount(t.amountUSD, "USD", currency, usdRates);
}

export function computeCategorySpend(
  transactions: Transaction[],
  categoryId: string,
  monthKey: string,
  currency: string,
  usdRates: UsdRates,
): number {
  let sum = 0;
  for (const t of transactions) {
    const sign = spendSign(t);
    if (
      sign !== 0 &&
      t.categoryId === categoryId &&
      monthKeyOf(t.date) === monthKey
    ) {
      sum += sign * (transactionAmountIn(t, currency, usdRates) ?? 0);
    }
  }
  return sum;
}

function statusFor(percent: number): BudgetStatus {
  if (percent > 1) return "over";
  if (percent >= 0.8) return "warning";
  return "on-track";
}

export function computeBudgetProgress(
  budget: Budget,
  transactions: Transaction[],
  monthKey: string,
  usdRates: UsdRates,
): BudgetProgress {
  const spent = computeCategorySpend(
    transactions,
    budget.categoryId,
    monthKey,
    budget.currency,
    usdRates,
  );
  const percent = budget.amount > 0 ? spent / budget.amount : 0;
  return {
    spent,
    remaining: budget.amount - spent,
    percent,
    status: statusFor(percent),
  };
}

/** Totals across all budgets, expressed in `currency`. */
export function computeBudgetTotals(
  budgets: Budget[],
  transactions: Transaction[],
  monthKey: string,
  currency: string,
  usdRates: UsdRates,
): BudgetTotals {
  const cappedIds = new Set(budgets.map((b) => b.categoryId));
  let totalCap = 0;
  let totalSpent = 0;
  let uncappedSpend = 0;

  for (const b of budgets) {
    totalCap += convertAmount(b.amount, b.currency, currency, usdRates) ?? 0;
  }

  for (const t of transactions) {
    const sign = spendSign(t);
    if (sign === 0 || monthKeyOf(t.date) !== monthKey) continue;
    const value = sign * (transactionAmountIn(t, currency, usdRates) ?? 0);
    if (cappedIds.has(t.categoryId)) totalSpent += value;
    else uncappedSpend += value;
  }

  return { totalCap, totalSpent, uncappedSpend };
}
