"use client";

import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import ProgressBar from "@/components/atoms/ProgressBar";
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

export default function BudgetRow({
  budget,
  category,
  progress,
  onEdit,
  onDelete,
}: BudgetRowProps) {
  const over = progress.status === "over";
  const bar =
    progress.status === "over"
      ? "expense"
      : progress.status === "warning"
        ? "expense"
        : "accent";

  const rightLabel = over
    ? `${formatCurrency(-progress.remaining, budget.currency)} over`
    : `${formatCurrency(progress.remaining, budget.currency)} left`;

  return (
    <article className="surface p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-fg truncate">
            {category?.name ?? "Unknown category"}
          </h3>
          <p className="text-xs text-fg-subtle mt-0.5">
            <Amount
              value={progress.spent}
              size="sm"
              tone={over ? "expense" : "neutral"}
              currency={budget.currency}
              className="!text-xs"
            />
            <span className="text-fg-subtle"> of </span>
            {formatCurrency(budget.amount, budget.currency)}
          </p>
        </div>
        <span
          className={
            over
              ? "text-sm font-medium text-expense"
              : progress.status === "warning"
                ? "text-sm font-medium text-fg"
                : "text-sm text-fg-muted"
          }
        >
          {rightLabel}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <ProgressBar
          value={progress.percent}
          tone={bar}
          ariaLabel={`${category?.name ?? "Budget"} progress`}
        />
        <div className="text-xs text-fg-subtle">
          {Math.round(progress.percent * 100)}%
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="flex gap-2 flex-wrap">
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
