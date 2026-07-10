"use client";

import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import type { Account, Category, Transaction } from "@/lib/types";

interface TransactionItemProps {
  transaction: Transaction;
  account?: Account;
  category?: Category;
  onDelete?: (id: string) => void;
  onSelect?: (transaction: Transaction) => void;
}

export default function TransactionItem({
  transaction,
  account,
  category,
  onDelete,
  onSelect,
}: TransactionItemProps) {
  const isIncome = transaction.type === "income";
  const title =
    transaction.description || category?.name || "Untitled transaction";

  const body = (
    <>
      <div
        aria-hidden
        className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-surface-2 border border-border text-base"
      >
        <span className={isIncome ? "text-income" : "text-expense"}>
          {isIncome ? "↑" : "↓"}
        </span>
      </div>

      <div className="flex-1 min-w-0 text-left">
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
        value={transaction.amountUSD}
        tone={isIncome ? "income" : "expense"}
        size="sm"
        currency="USD"
        showSign
        className="shrink-0 text-right sm:text-base"
      />
    </>
  );

  return (
    <li className="flex items-center gap-3 py-3">
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(transaction)}
          className={cn(
            "flex flex-1 items-center gap-3 min-w-0 rounded-[10px]",
            "-mx-2 px-2 py-1 transition-colors hover:bg-surface-2",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          )}
        >
          {body}
        </button>
      ) : (
        <div className="flex flex-1 items-center gap-3 min-w-0">{body}</div>
      )}

      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          aria-label="Delete transaction"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(transaction.id);
          }}
          className="px-2"
        >
          ×
        </Button>
      )}
    </li>
  );
}
