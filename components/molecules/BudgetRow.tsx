"use client";

import Button from "@/components/atoms/Button";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import type { Budget, Category } from "@/lib/types";
import type { BudgetProgress } from "@/lib/utils/budgets";

interface BudgetRowProps {
  budget: Budget;
  category?: Category;
  progress: BudgetProgress;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budget: Budget) => void;
}

function projectMonthEnd(spent: number): number | null {
  if (spent <= 0) return null;
  const now = new Date();
  const day = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  if (day <= 0 || day >= daysInMonth) return null;
  const monthProgress = day / daysInMonth;
  if (monthProgress <= 0) return null;
  return spent / monthProgress;
}

/**
 * Alcove budget row — a hairline-walled panel. Name and figure share the top
 * line; a thin rule below fills as the cap does; a soft note underneath tells
 * the story ("$32 left" / "Over cap by $12") without shouting.
 */
export default function BudgetRow({
  budget,
  category,
  progress,
  onEdit,
  onDelete,
}: BudgetRowProps) {
  const over = progress.status === "over";
  const categoryName = category?.name ?? "Unknown category";
  const pct = Math.max(0, Math.min(100, progress.percent * 100));
  const projected = projectMonthEnd(progress.spent);

  const paceLine =
    !over && projected !== null
      ? projected <= budget.amount
        ? `On pace: ${formatCurrency(
            budget.amount - projected,
            budget.currency,
          )} under.`
        : `On pace: ${formatCurrency(
            projected - budget.amount,
            budget.currency,
          )} over.`
      : null;

  const noteText = over
    ? `Over cap by ${formatCurrency(-progress.remaining, budget.currency)}.`
    : `${formatCurrency(progress.remaining, budget.currency)} left this month.`;

  return (
    <article className="px-4 py-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-serif text-base text-fg truncate">
          {categoryName}
        </span>
        <span className="figure text-xs text-fg whitespace-nowrap">
          <span className="text-fg">
            {formatCurrency(progress.spent, budget.currency)}
          </span>
          <span className="text-fg-muted">
            {" / "}
            {formatCurrency(budget.amount, budget.currency)}
          </span>
        </span>
      </div>

      <div
        className="relative h-px bg-border overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${pct}%`,
            height: over ? 2 : 1,
            top: over ? -1 : 0,
            background: over
              ? "var(--color-expense)"
              : "var(--color-celadon-strong)",
          }}
        />
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <span
          className={cn(
            "lede text-xs",
            over && "text-expense",
          )}
        >
          {noteText}
        </span>
        {paceLine && (
          <span
            suppressHydrationWarning
            className="lede text-[11px] text-right"
          >
            {paceLine}
          </span>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className="flex gap-2 pt-2 border-t border-border">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(budget)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(budget)}>
              Delete
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
