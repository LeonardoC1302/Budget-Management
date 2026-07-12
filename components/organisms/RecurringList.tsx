"use client";

import RecurringItem from "@/components/molecules/RecurringItem";
import type { Account, Category, RecurringTransaction } from "@/lib/types";

interface RecurringListProps {
  templates: RecurringTransaction[];
  accountsById?: Record<string, Account>;
  categoriesById?: Record<string, Category>;
  onEdit?: (template: RecurringTransaction) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string) => void;
  emptyMessage?: string;
}

export default function RecurringList({
  templates,
  accountsById,
  categoriesById,
  onEdit,
  onDelete,
  onToggleActive,
  emptyMessage = "No recurring transactions yet.",
}: RecurringListProps) {
  if (templates.length === 0) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-fg-muted text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="surface divide-y divide-border px-4">
      {templates.map((t) => (
        <RecurringItem
          key={t.id}
          template={t}
          account={accountsById?.[t.accountId]}
          category={categoriesById?.[t.categoryId]}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
        />
      ))}
    </ul>
  );
}
