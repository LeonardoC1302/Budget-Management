"use client";

import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import { formatDate } from "@/lib/utils/format";
import type { Account, Category, Transaction } from "@/lib/types";

interface TransactionItemProps {
  transaction: Transaction;
  account?: Account;
  category?: Category;
  onDelete?: (id: string) => void;
}

export default function TransactionItem({
  transaction,
  account,
  category,
  onDelete,
}: TransactionItemProps) {
  const isIncome = transaction.type === "income";
  const title =
    transaction.description || category?.name || "Untitled transaction";

  return (
    <li className="flex items-center gap-3 py-3">
      <div
        aria-hidden
        className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-surface-2 border border-border text-base"
      >
        <span className={isIncome ? "text-income" : "text-expense"}>
          {isIncome ? "↑" : "↓"}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-fg truncate">{title}</p>
        <p className="text-xs text-fg-subtle truncate">
          {category?.name ?? "—"}
          {account && (
            <>
              <span className="mx-1">·</span>
              <span>{account.name}</span>
            </>
          )}
          <span className="mx-1">·</span>
          {formatDate(transaction.date)}
        </p>
      </div>

      <Amount
        value={transaction.amount}
        tone={isIncome ? "income" : "expense"}
        size="md"
        currency={account?.currency ?? "USD"}
        showSign
      />

      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          aria-label="Delete transaction"
          onClick={() => onDelete(transaction.id)}
          className="px-2"
        >
          ×
        </Button>
      )}
    </li>
  );
}
