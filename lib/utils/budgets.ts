import type { Budget, Transaction } from "@/lib/types";

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

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
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

export function computeCategorySpend(
  transactions: Transaction[],
  categoryId: string,
  monthKey: string,
): number {
  let sum = 0;
  for (const t of transactions) {
    if (
      t.type === "expense" &&
      t.categoryId === categoryId &&
      monthKeyOf(t.date) === monthKey
    ) {
      sum += t.amountUSD;
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
): BudgetProgress {
  const spent = computeCategorySpend(transactions, budget.categoryId, monthKey);
  const percent = budget.amount > 0 ? spent / budget.amount : 0;
  return {
    spent,
    remaining: budget.amount - spent,
    percent,
    status: statusFor(percent),
  };
}

export function computeBudgetTotals(
  budgets: Budget[],
  transactions: Transaction[],
  monthKey: string,
): BudgetTotals {
  const cappedIds = new Set(budgets.map((b) => b.categoryId));
  let totalCap = 0;
  let totalSpent = 0;
  let uncappedSpend = 0;

  for (const b of budgets) totalCap += b.amount;

  for (const t of transactions) {
    if (t.type !== "expense" || monthKeyOf(t.date) !== monthKey) continue;
    if (cappedIds.has(t.categoryId)) totalSpent += t.amountUSD;
    else uncappedSpend += t.amountUSD;
  }

  return { totalCap, totalSpent, uncappedSpend };
}
