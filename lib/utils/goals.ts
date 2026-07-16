import type { Goal, GoalContribution, Transaction } from "@/lib/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30;
const MIN_HISTORY_DAYS = 30;

export interface GoalProgress {
  saved: number;
  remaining: number;
  percent: number;
  reached: boolean;
}

export function computeGoalProgress(
  goal: Goal,
  contributions: GoalContribution[],
): GoalProgress {
  const contributed = contributions
    .filter((c) => c.goalId === goal.id)
    .reduce((sum, c) => sum + c.amount, 0);
  const saved = goal.initialAmount + contributed;
  const remaining = Math.max(goal.targetAmount - saved, 0);
  const percent = goal.targetAmount > 0
    ? Math.min(saved / goal.targetAmount, 1)
    : 0;
  return {
    saved,
    remaining,
    percent,
    reached: saved >= goal.targetAmount,
  };
}

/**
 * Average monthly net savings inferred from the transaction history span.
 * Returns null when there isn't enough history (<30 days) to estimate.
 * Result is denominated in USD (BASE_CURRENCY) so amounts from mixed-currency
 * accounts are comparable.
 */
export function computeMonthlySavingsRate(
  transactions: Transaction[],
): number | null {
  if (transactions.length === 0) return null;

  const times = transactions.map((t) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(t.date);
    if (!match) return new Date(t.date).getTime();
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime();
  });
  const earliest = Math.min(...times);
  const latest = Math.max(...times, Date.now());
  const spanDays = Math.max((latest - earliest) / MS_PER_DAY, 1);

  if (spanDays < MIN_HISTORY_DAYS) return null;

  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === "income") income += t.amountUSD;
    else if (t.type === "expense") expense += t.amountUSD;
  }
  const net = income - expense;
  return (net * DAYS_PER_MONTH) / spanDays;
}

export type EstimateStatus =
  | { kind: "reached" }
  | { kind: "no-data" }
  | { kind: "negative"; monthlyRate: number }
  | { kind: "estimated"; monthlyRate: number; months: number; targetDate: Date };

export function estimateTimeToGoal(
  goal: Goal,
  contributions: GoalContribution[],
  monthlyRate: number | null,
): EstimateStatus {
  const { reached, remaining } = computeGoalProgress(goal, contributions);
  if (reached) return { kind: "reached" };
  if (monthlyRate === null) return { kind: "no-data" };
  if (monthlyRate <= 0) return { kind: "negative", monthlyRate };

  const months = remaining / monthlyRate;
  const target = new Date();
  target.setMonth(target.getMonth() + Math.ceil(months));
  return { kind: "estimated", monthlyRate, months, targetDate: target };
}

export function formatMonthsRough(months: number): string {
  if (months < 1) {
    const weeks = Math.max(Math.round(months * 4.345), 1);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  }
  if (months < 12) {
    const rounded = Math.ceil(months);
    return `${rounded} ${rounded === 1 ? "month" : "months"}`;
  }
  const years = Math.floor(months / 12);
  const remMonths = Math.ceil(months - years * 12);
  if (remMonths === 0 || remMonths === 12) {
    const y = remMonths === 12 ? years + 1 : years;
    return `${y} ${y === 1 ? "year" : "years"}`;
  }
  return `${years}y ${remMonths}mo`;
}

export function formatTargetMonth(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
