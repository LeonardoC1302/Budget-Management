"use client";

import TransactionItem from "@/components/molecules/TransactionItem";
import type { Account, Category, Transaction } from "@/lib/types";

interface TransactionListProps {
  transactions: Transaction[];
  accountsById?: Record<string, Account>;
  categoriesById?: Record<string, Category>;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
}

export default function TransactionList({
  transactions,
  accountsById,
  categoriesById,
  onDelete,
  emptyMessage = "No transactions yet.",
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-fg-muted text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="surface divide-y divide-border px-4">
      {transactions.map((t) => (
        <TransactionItem
          key={t.id}
          transaction={t}
          account={accountsById?.[t.accountId]}
          category={categoriesById?.[t.categoryId]}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
