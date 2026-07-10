"use client";

import BudgetRow from "@/components/molecules/BudgetRow";
import type { Budget, Category } from "@/lib/types";
import type { BudgetProgress } from "@/lib/utils/budgets";

interface BudgetListProps {
  budgets: Budget[];
  categoriesById: Record<string, Category>;
  progressByCategory: Record<string, BudgetProgress>;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budget: Budget) => void;
  emptyMessage?: string;
}

export default function BudgetList({
  budgets,
  categoriesById,
  progressByCategory,
  onEdit,
  onDelete,
  emptyMessage = "No budgets yet.",
}: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-fg-muted text-sm">{emptyMessage}</p>
      </div>
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
