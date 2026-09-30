import type { Transaction } from "@/lib/types";

// A refund is stored as income (so account balances and card statements add
// it back without special cases) that points at the expense it reverses via
// `refundOf`. Spending math treats it as negative spend in the original
// category rather than as income, so a returned purchase lowers that month's
// spend instead of inflating income.

type Classifiable = Pick<Transaction, "type" | "refundOf">;

export function isRefund(t: Classifiable): boolean {
  return t.type === "income" && !!t.refundOf;
}

/** Income that isn't a refund. */
export function countsAsIncome(t: Classifiable): boolean {
  return t.type === "income" && !t.refundOf;
}

/** +1 for an expense, -1 for a refund, 0 for anything else. */
export function spendSign(t: Classifiable): 1 | -1 | 0 {
  if (t.type === "expense") return 1;
  if (isRefund(t)) return -1;
  return 0;
}

/** Sum of refunds recorded against each expense id. */
export function refundedByExpense(
  transactions: Pick<Transaction, "type" | "refundOf" | "amount">[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of transactions) {
    if (!isRefund(t)) continue;
    out[t.refundOf!] = (out[t.refundOf!] ?? 0) + t.amount;
  }
  return out;
}
