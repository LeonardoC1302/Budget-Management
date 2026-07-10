import type { Category, Transaction } from "@/lib/types";
import { monthKeyOf } from "@/lib/utils/budgets";

export interface MonthlyTotal {
  income: number;
  expense: number;
  net: number;
}

export interface MonthlyPoint extends MonthlyTotal {
  monthKey: string;
  label: string;
}

export function monthKeyOffset(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(monthKey: string, short = true): string {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return short
    ? d.toLocaleDateString("en-US", { month: "short" })
    : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function getMonthlyTotals(
  transactions: Transaction[],
  monthKey: string,
): MonthlyTotal {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (monthKeyOf(t.date) !== monthKey) continue;
    if (t.type === "income") income += t.amountUSD;
    else if (t.type === "expense") expense += t.amountUSD;
  }
  return { income, expense, net: income - expense };
}

export function getMonthlySeries(
  transactions: Transaction[],
  months: number,
): MonthlyPoint[] {
  const points: MonthlyPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const monthKey = monthKeyOffset(-i);
    const totals = getMonthlyTotals(transactions, monthKey);
    points.push({ monthKey, label: monthLabel(monthKey), ...totals });
  }
  return points;
}

export interface CategorySlice {
  categoryId: string;
  name: string;
  amount: number;
  share: number;
}

export interface CategoryBreakdown {
  slices: CategorySlice[];
  total: number;
}

export function getCategoryBreakdown(
  transactions: Transaction[],
  categoriesById: Record<string, Category>,
  monthKey: string,
  limit = 5,
): CategoryBreakdown {
  const totals: Record<string, number> = {};
  let total = 0;

  for (const t of transactions) {
    if (t.type !== "expense" || monthKeyOf(t.date) !== monthKey) continue;
    totals[t.categoryId] = (totals[t.categoryId] ?? 0) + t.amountUSD;
    total += t.amountUSD;
  }

  const sorted = Object.entries(totals)
    .map(([categoryId, amount]) => ({
      categoryId,
      name: categoriesById[categoryId]?.name ?? "Unknown",
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  if (total === 0) return { slices: [], total: 0 };

  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  const restAmount = rest.reduce((sum, s) => sum + s.amount, 0);

  const slices: CategorySlice[] = top.map((s) => ({
    ...s,
    share: s.amount / total,
  }));

  if (restAmount > 0) {
    slices.push({
      categoryId: "__other__",
      name: "Other",
      amount: restAmount,
      share: restAmount / total,
    });
  }

  return { slices, total };
}

export type DeltaDirection = "up" | "down" | "flat" | "na";

export interface Delta {
  direction: DeltaDirection;
  percent: number; // 0-1, unsigned
}

export function computeDelta(current: number, previous: number): Delta {
  if (previous === 0) {
    if (current === 0) return { direction: "flat", percent: 0 };
    return { direction: "na", percent: 0 };
  }
  const diff = current - previous;
  const percent = Math.abs(diff / previous);
  if (Math.abs(diff) < 0.005) return { direction: "flat", percent: 0 };
  return { direction: diff > 0 ? "up" : "down", percent };
}
