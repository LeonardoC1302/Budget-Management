"use client";

import EmptyState from "@/components/atoms/EmptyState";
import RecurringItem from "@/components/molecules/RecurringItem";
import type { Account, Category, RecurringTransaction } from "@/lib/types";

interface RecurringListProps {
  templates: RecurringTransaction[];
  accountsById?: Record<string, Account>;
  categoriesById?: Record<string, Category>;
  onEdit?: (template: RecurringTransaction) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionOnClick?: () => void;
  emptyActionHref?: string;
  /** @deprecated Use `emptyTitle` instead. Kept for backwards compat. */
  emptyMessage?: string;
}

export default function RecurringList({
  templates,
  accountsById,
  categoriesById,
  onEdit,
  onDelete,
  onToggleActive,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionOnClick,
  emptyActionHref,
  emptyMessage = "No recurring transactions yet.",
}: RecurringListProps) {
  if (templates.length === 0) {
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
