import type { Account, Transaction } from "@/lib/types";
import { isRefund } from "@/lib/utils/refunds";

/**
 * Which card charges are paid, and how much of each payment actually counts.
 *
 * A card's debt is the charges that haven't been paid. Payments settle
 * charges in this order:
 * 1. the charges picked in the pay form (`paidChargeIds`), in full;
 * 2. with what's left, the oldest unpaid charges before the payment.
 * Money beyond every charge before it is an advance, used by later charges.
 *
 * A payment made from another currency lands on the card at an exchange
 * rate, so it rarely matches the charges it paid to the cent: a $647.19
 * payment can come out at ₡366,157 against a ₡357,045 statement after the
 * card changes currency. When such a payment is within CROSS_CURRENCY_TOLERANCE
 * of the statement it paid (or of everything owed), it counts as paying it
 * exactly, so exchange-rate noise never shows up as a phantom credit or a
 * few leftover colones.
 */

const CROSS_CURRENCY_TOLERANCE = 0.03;
const CENT = 0.005;

export interface CardSettlement {
  /** Amount each payment (transfer into the card) counts for, in card currency. */
  paymentAmount: Map<string, number>;
  /** What's still unpaid on each charge, in card currency. */
  unpaid: Map<string, number>;
}

function isCharge(t: Transaction): boolean {
  return (
    t.type === "expense" ||
    t.type === "investment" ||
    (t.type === "transfer" && t.transferDirection === "out")
  );
}

function isPayment(t: Transaction): boolean {
  return t.type === "transfer" && t.transferDirection === "in";
}

function localDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
}

/** The last cut on or before `iso`, as YYYY-MM-DD. */
function cutOnOrBefore(iso: string, cutDay: number): string {
  const d = localDate(iso);
  const at = (y: number, m: number) => {
    const last = new Date(y, m + 1, 0).getDate();
    return new Date(y, m, Math.min(cutDay, last));
  };
  let cut = at(d.getFullYear(), d.getMonth());
  if (cut.getTime() > d.getTime()) cut = at(d.getFullYear(), d.getMonth() - 1);
  const mm = String(cut.getMonth() + 1).padStart(2, "0");
  const dd = String(cut.getDate()).padStart(2, "0");
  return `${cut.getFullYear()}-${mm}-${dd}`;
}

const amountOf = (t: Transaction) => t.accountAmount ?? t.amount;

function within(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) <= Math.max(CENT, tolerance * Math.max(a, b));
}

export function settleCard(account: Account, transactions: Transaction[]): CardSettlement {
  const paymentAmount = new Map<string, number>();
  const unpaid = new Map<string, number>();
  const txs = transactions
    .filter((t) => t.accountId === account.id)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      // Same day: charges first, so a same-day payment can cover them.
      return Number(isPayment(a)) - Number(isPayment(b));
    });

  // Unpaid charges, oldest first.
  const open: { id: string; date: string; left: number }[] = [];
  let advance = Math.max(0, account.initialBalance);
  if (account.initialBalance < -CENT) {
    open.push({ id: "", date: "", left: -account.initialBalance });
  }

  const settle = (item: { left: number }, amount: number) => {
    const take = Math.min(item.left, amount);
    item.left -= take;
    return take;
  };
  const prune = () => {
    for (let i = open.length - 1; i >= 0; i--) {
      if (open[i].left <= CENT) open.splice(i, 1);
    }
  };
  const settleOldest = (amount: number, until?: string) => {
    let left = amount;
    for (const item of open) {
      if (left <= CENT) break;
      if (until !== undefined && item.date > until) break;
      left -= settle(item, left);
    }
    prune();
    return amount - left;
  };
  const openTotal = (until?: string) =>
    open.reduce((s, i) => (until === undefined || i.date <= until ? s + i.left : s), 0);

  for (const t of txs) {
    const amount = amountOf(t);
    if (isCharge(t)) {
      const item = { id: t.id, date: t.date, left: amount };
      if (advance > CENT) advance -= settle(item, advance);
      if (item.left > CENT) open.push(item);
      continue;
    }
    if (t.type === "income") {
      // A refund clears the purchase it refunds first; other credits act
      // like a payment with nothing selected.
      const target = isRefund(t) ? open.find((i) => i.id === t.refundOf) : undefined;
      let left = amount;
      if (target) left -= settle(target, left);
      prune();
      left -= settleOldest(left);
      advance += Math.max(0, left);
      continue;
    }
    if (!isPayment(t)) continue;

    const cross = t.currency !== account.currency;
    const tolerance = cross ? CROSS_CURRENCY_TOLERANCE : 0;

    // 1. Charges picked in the pay form.
    const picked = new Set(t.paidChargeIds ?? []);
    const listed = open.filter((i) => picked.has(i.id));
    const listedTotal = listed.reduce((s, i) => s + i.left, 0);
    let rest = amount - listedTotal;
    if (listed.length > 0 && rest < 0 && !within(amount, listedTotal, tolerance)) {
      // Paid clearly less than what was picked: pay those, oldest first.
      let left = amount;
      for (const i of listed) left -= settle(i, left);
      prune();
      paymentAmount.set(t.id, amount);
      continue;
    }
    for (const i of listed) i.left = 0;
    prune();
    let counted = listedTotal;
    if (rest <= CENT || (listed.length > 0 && within(amount, listedTotal, tolerance))) {
      paymentAmount.set(t.id, listed.length > 0 ? counted : amount);
      continue;
    }

    // 2. The rest pays the statement it was due for, or everything owed.
    const statementCut = account.cutDay ? cutOnOrBefore(t.date, account.cutDay) : undefined;
    const statementOpen = openTotal(statementCut);
    const allOpen = openTotal(t.date);
    if (statementOpen > CENT && within(rest, statementOpen, tolerance)) {
      counted += settleOldest(statementOpen, statementCut);
      rest = 0;
    } else if (allOpen > CENT && within(rest, allOpen, tolerance)) {
      counted += settleOldest(allOpen, t.date);
      rest = 0;
    } else {
      const paid = settleOldest(rest, t.date);
      counted += paid;
      rest -= paid;
    }
    // 3. Anything left is an advance toward later charges.
    if (rest > CENT) {
      advance += rest;
      counted += rest;
    }
    paymentAmount.set(t.id, counted);
  }

  for (const i of open) if (i.id) unpaid.set(i.id, i.left);
  return { paymentAmount, unpaid };
}

/**
 * The card's transactions with each payment's `accountAmount` replaced by the
 * amount it settles, so balance math (owed, statement due, paid by due date)
 * follows what's unpaid rather than raw converted payment amounts.
 */
export function withSettledPayments(
  account: Account,
  transactions: Transaction[],
): Transaction[] {
  const { paymentAmount } = settleCard(account, transactions);
  if (paymentAmount.size === 0) return transactions;
  return transactions.map((t) =>
    paymentAmount.has(t.id) ? { ...t, accountAmount: paymentAmount.get(t.id)! } : t,
  );
}
