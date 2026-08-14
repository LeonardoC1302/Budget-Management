"use client";

import EmptyState from "@/components/atoms/EmptyState";
import TransactionItem from "@/components/molecules/TransactionItem";
import { formatDateHeader } from "@/lib/utils/format";
import { formatCurrency } from "@/lib/utils/format";
import type { Account, Category, Transaction } from "@/lib/types";

interface TransactionListProps {
  transactions: Transaction[];
  accountsById?: Record<string, Account>;
  categoriesById?: Record<string, Category>;
  onSelect?: (transaction: Transaction) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionOnClick?: () => void;
  emptyActionHref?: string;
  /** @deprecated */
  emptyMessage?: string;
  groupByDate?: boolean;
  /** Collapse each transfer's paired docs into a single source → destination row. */
  groupTransfers?: boolean;
}

/**
 * Alcove list of transactions. When grouped by date, each day gets its own
 * day-head with a running daily net, then the entries stack in a hairline
 * `.rooms` container.
 */
export default function TransactionList({
  transactions,
  accountsById,
  categoriesById,
  onSelect,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionOnClick,
  emptyActionHref,
  emptyMessage = "No transactions yet.",
  groupByDate = false,
  groupTransfers = false,
}: TransactionListProps) {
  const visible = groupTransfers
    ? transactions.filter(
        (t) => t.type !== "transfer" || t.transferDirection !== "in",
      )
    : transactions;

  if (visible.length === 0) {
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

  const renderItem = (t: Transaction, hideDate: boolean) => (
    <TransactionItem
      key={t.id}
      transaction={t}
      account={accountsById?.[t.accountId]}
      category={categoriesById?.[t.categoryId]}
      linkedAccount={
        t.linkedAccountId ? accountsById?.[t.linkedAccountId] : undefined
      }
      onSelect={onSelect}
      groupedTransfer={groupTransfers}
      hideDate={hideDate}
    />
  );

  if (!groupByDate) {
    return (
      <div className="rooms" role="list">
        {visible.map((t) => renderItem(t, false))}
      </div>
    );
  }

  const groups: {
    date: string;
    income: number;
    expense: number;
    items: Transaction[];
  }[] = [];
  for (const t of visible) {
    const dateKey = t.date.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last.date === dateKey) {
      last.items.push(t);
      if (t.type === "income") last.income += t.amountUSD;
      else if (t.type === "expense") last.expense += t.amountUSD;
    } else {
      groups.push({
        date: dateKey,
        income: t.type === "income" ? t.amountUSD : 0,
        expense: t.type === "expense" ? t.amountUSD : 0,
        items: [t],
      });
    }
  }

  return (
    <div className="flex flex-col">
      {groups.map((group) => {
        const net = group.income - group.expense;
        const netTone = net >= 0 ? "pos" : "neg";
        return (
          <section key={group.date}>
            <div className="day-head">
              <span className="day-head-title">
                {formatDateHeader(group.date)}
              </span>
              <span className={`day-head-meta ${netTone}`}>
                {net >= 0 ? "+" : "−"}
                {formatCurrency(Math.abs(net), "USD")}
              </span>
            </div>
            <div className="rooms" role="list">
              {group.items.map((t) => renderItem(t, true))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
