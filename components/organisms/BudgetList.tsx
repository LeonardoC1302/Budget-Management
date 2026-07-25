"use client";

import EmptyState from "@/components/atoms/EmptyState";
import BudgetRow from "@/components/molecules/BudgetRow";
import type { Budget, Category } from "@/lib/types";
import type { BudgetProgress } from "@/lib/utils/budgets";

interface BudgetListProps {
  budgets: Budget[];
  categoriesById: Record<string, Category>;
  progressByCategory: Record<string, BudgetProgress>;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budget: Budget) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionOnClick?: () => void;
  emptyActionHref?: string;
  /** @deprecated Use `emptyTitle` instead. Kept for backwards compat. */
  emptyMessage?: string;
}

export default function BudgetList({
  budgets,
  categoriesById,
  progressByCategory,
  onEdit,
  onDelete,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionOnClick,
  emptyActionHref,
  emptyMessage = "No budgets yet.",
}: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? emptyMessage}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        actionOnClick={emptyActionOnClick}
        actionHref={emptyActionHref}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {budgets.map((budget) => (
        <li key={budget.id}>
          <BudgetRow
            budget={budget}
            category={categoriesById[budget.categoryId]}
            progress={
              progressByCategory[budget.categoryId] ?? {
                spent: 0,
                remaining: budget.amount,
                percent: 0,
                status: "on-track",
              }
            }
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
