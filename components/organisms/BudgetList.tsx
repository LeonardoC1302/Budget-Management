"use client";

import EmptyState from "@/components/atoms/EmptyState";
import BudgetRow from "@/components/molecules/BudgetRow";
import type { Budget, Category } from "@/lib/types";
import type { BudgetProgress } from "@/lib/utils/budgets";
import type { BudgetMonth } from "@/hooks/useBudgets";

import { t } from "@/lib/i18n";
interface BudgetListProps {
  budgets: Budget[];
  categoriesById: Record<string, Category>;
  progressByCategory: Record<string, BudgetProgress>;
  isCurrentMonth?: boolean;
  history?: BudgetMonth[];
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
  isCurrentMonth,
  history,
  onEdit,
  onDelete,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionOnClick,
  emptyActionHref,
  emptyMessage = t("No budgets yet."),
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
              cap: budget.amount,
              currency: budget.currency,
              remaining: budget.amount,
              percent: 0,
              status: "on-track",
            }
          }
          isCurrentMonth={isCurrentMonth}
          trend={history?.map((m) => ({
            monthKey: m.monthKey,
            progress: m.byCategory[budget.categoryId],
          }))}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
