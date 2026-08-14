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
    <div className="rooms" role="list">
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
    </div>
  );
}
