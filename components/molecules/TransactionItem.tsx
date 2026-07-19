"use client";

import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import TransactionTypeIcon from "@/components/atoms/TransactionTypeIcon";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import type { Account, Category, Transaction } from "@/lib/types";

interface TransactionItemProps {
  transaction: Transaction;
  account?: Account;
  category?: Category;
  linkedAccount?: Account;
  onDelete?: (id: string) => void;
  onSelect?: (transaction: Transaction) => void;
}

export default function TransactionItem({
  transaction,
  account,
  category,
  linkedAccount,
  onDelete,
  onSelect,
}: TransactionItemProps) {
  const isTransfer = transaction.type === "transfer";
  const isIncome = transaction.type === "income";
  const isInvestment = transaction.type === "investment";
  const isInflow = isIncome || (isTransfer && transaction.transferDirection === "in");

  let title: string;
  let subtitle: string;
  let iconVariant: "up" | "down" | "transfer" | "invest";
  let iconClass: string;
  let tone: "income" | "expense" | "neutral";

  if (isTransfer) {
    const other = linkedAccount?.name ?? "another account";
    const defaultTitle =
      transaction.transferDirection === "in"
        ? `Transfer from ${other}`
        : `Transfer to ${other}`;
    title = transaction.description || defaultTitle;
    subtitle = `${account?.name ?? "—"} · ${formatDate(transaction.date)}`;
    iconVariant = "transfer";
    iconClass = "text-fg-muted";
    tone = "neutral";
  } else if (isInvestment) {
    title = transaction.description || category?.name || "Investment";
    subtitle = `${category?.name ?? "—"}${
      account ? ` · ${account.name}` : ""
    } · ${formatDate(transaction.date)}`;
    iconVariant = "invest";
    iconClass = "text-invest";
    tone = "neutral";
  } else {
    title = transaction.description || category?.name || "Untitled transaction";
    subtitle = `${category?.name ?? "—"}${
      account ? ` · ${account.name}` : ""
    } · ${formatDate(transaction.date)}`;
    iconVariant = isIncome ? "up" : "down";
    iconClass = isIncome ? "text-income" : "text-expense";
    tone = isIncome ? "income" : "expense";
  }

  const body = (
    <>
      <div
        aria-hidden
        className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-surface-2 border border-border"
      >
        <TransactionTypeIcon variant={iconVariant} className={iconClass} />
      </div>

      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium text-fg truncate flex items-center gap-1.5">
          <span className="truncate">{title}</span>
          {transaction.recurringId && (
            <span
              aria-label="Recurring"
              title="From a recurring rule"
              className="text-xs text-fg-subtle shrink-0"
            >
              ↻
            </span>
          )}
        </p>
        <p className="text-xs text-fg-subtle truncate">{subtitle}</p>
      </div>

      <Amount
        value={isTransfer ? transaction.amount : transaction.amountUSD}
        tone={tone}
        size="sm"
        currency={isTransfer ? transaction.currency : "USD"}
        showSign={!isTransfer && !isInvestment}
        className={cn(
          "shrink-0 text-right sm:text-base",
          isTransfer && (isInflow ? "text-income" : "text-expense"),
          isInvestment && "text-invest",
        )}
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
