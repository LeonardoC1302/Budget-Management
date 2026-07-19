"use client";

import TransactionItem from "@/components/molecules/TransactionItem";
import { formatDateHeader } from "@/lib/utils/format";
import type { Account, Category, Transaction } from "@/lib/types";

interface TransactionListProps {
  transactions: Transaction[];
  accountsById?: Record<string, Account>;
  categoriesById?: Record<string, Category>;
  onDelete?: (id: string) => void;
  onSelect?: (transaction: Transaction) => void;
  emptyMessage?: string;
  groupByDate?: boolean;
}

export default function TransactionList({
  transactions,
  accountsById,
  categoriesById,
  onDelete,
  onSelect,
  emptyMessage = "No transactions yet.",
  groupByDate = false,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-fg-muted text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const renderItem = (t: Transaction) => (
    <TransactionItem
      key={t.id}
      transaction={t}
      account={accountsById?.[t.accountId]}
      category={categoriesById?.[t.categoryId]}
      linkedAccount={
        t.linkedAccountId ? accountsById?.[t.linkedAccountId] : undefined
      }
      onDelete={onDelete}
      onSelect={onSelect}
    />
  );

  if (!groupByDate) {
    return (
      <ul className="surface divide-y divide-border px-4">
        {transactions.map(renderItem)}
      </ul>
    );
  }

  const groups: { date: string; items: Transaction[] }[] = [];
  for (const t of transactions) {
    const dateKey = t.date.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last.date === dateKey) {
      last.items.push(t);
    } else {
      groups.push({ date: dateKey, items: [t] });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.date} className="flex flex-col gap-1.5">
          <p className="px-1 text-xs text-fg-subtle">
            {formatDateHeader(group.date)}
          </p>
          <ul className="surface divide-y divide-border px-4">
            {group.items.map(renderItem)}
          </ul>
        </div>
      ))}
    </div>
  );
}
