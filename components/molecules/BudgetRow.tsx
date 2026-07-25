"use client";

import Button from "@/components/atoms/Button";
import CategoryChip from "@/components/atoms/CategoryChip";
import ProgressBar from "@/components/atoms/ProgressBar";
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

export default function BudgetRow({
  budget,
  category,
  progress,
  onEdit,
  onDelete,
}: BudgetRowProps) {
  const over = progress.status === "over";
  const warning = progress.status === "warning";
  const categoryName = category?.name ?? "Unknown category";

  const chipTone: "expense" | "invest" | "accent" = over
    ? "expense"
    : warning
      ? "invest"
      : "accent";
  const barTone: "accent" | "expense" = over || warning ? "expense" : "accent";
  const stripeClass = over
    ? "bg-expense"
    : warning
      ? "bg-invest"
      : "bg-accent/60";

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

  const primaryAmount = over
    ? formatCurrency(-progress.remaining, budget.currency)
    : formatCurrency(progress.remaining, budget.currency);
  const primaryLabel = over ? "over cap" : "left this month";

  return (
    <article
      className={cn(
        "surface relative overflow-hidden p-5 flex flex-col gap-4",
        over && "border-expense/40",
      )}
    >
      <span
        aria-hidden
        className={cn("absolute left-0 top-0 bottom-0 w-1", stripeClass)}
      />

      <div className="flex items-center gap-4">
        <CategoryChip name={categoryName} tone={chipTone} size="md" />
        <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-fg truncate">
              {categoryName}
            </h3>
            <p className="text-xs text-fg-subtle mt-0.5 tabular-nums">
              {formatCurrency(progress.spent, budget.currency)} of{" "}
              {formatCurrency(budget.amount, budget.currency)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p
              className={cn(
                "text-lg font-semibold tabular-nums leading-tight",
                over ? "text-expense" : "text-fg",
              )}
            >
              {primaryAmount}
            </p>
            <p className="text-[11px] text-fg-subtle uppercase tracking-wide mt-0.5">
              {primaryLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <ProgressBar
          value={progress.percent}
          tone={barTone}
          ariaLabel={`${categoryName} progress`}
        />
        <div className="flex items-center justify-between gap-3 text-xs text-fg-subtle tabular-nums">
          <span>{Math.round(progress.percent * 100)}% used</span>
          {paceLine && (
            <span suppressHydrationWarning className="text-right">
              {paceLine}
            </span>
          )}
        </div>
      </div>

      {over && (
        <p className="text-xs text-fg-subtle">
          Recorded. You can raise the cap or trim spending anytime in Budgets.
        </p>
      )}

      {(onEdit || onDelete) && (
        <div className="flex gap-2 flex-wrap pt-3 border-t border-border">
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(budget)}>
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
