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
    <div className="rooms" role="list">
      {budgets.map((budget) => (
        <BudgetRow
          key={budget.id}
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
      ))}
    </div>
  );
}
