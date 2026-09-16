"use client";

import EmptyState from "@/components/atoms/EmptyState";
import TransactionItem from "@/components/molecules/TransactionItem";
import { usePreferences } from "@/contexts/PreferencesContext";
import { formatDateHeader } from "@/lib/utils/format";
import { formatCurrencyCompact, formatCurrency } from "@/lib/utils/format";
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
  /** Preview surfaces (home page recent activity) use compact notation. */
  compact?: boolean;
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
  compact = false,
}: TransactionListProps) {
  const { displayCurrency, convertUsd } = usePreferences();
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
      compact={compact}
    />
  );

  if (!groupByDate) {
    return (
      <div className="rooms" role="list">
        {visible.map((t) => renderItem(t, false))}
      </div>
    );
  }

  // Native amounts (already in displayCurrency) are summed as-is; amounts in
  // other currencies fall back to the USD-normalized aggregate, converted once.
  const groups: {
    date: string;
    nativeIncome: number;
    nativeExpense: number;
    usdIncome: number;
    usdExpense: number;
    items: Transaction[];
  }[] = [];
  for (const t of visible) {
    const dateKey = t.date.slice(0, 10);
    const isNative = t.currency === displayCurrency;
    const last = groups[groups.length - 1];
    const group =
      last && last.date === dateKey
        ? last
        : (() => {
            const g = {
              date: dateKey,
              nativeIncome: 0,
              nativeExpense: 0,
              usdIncome: 0,
              usdExpense: 0,
              items: [] as Transaction[],
            };
            groups.push(g);
            return g;
          })();
    group.items.push(t);
    if (t.type === "income") {
      if (isNative) group.nativeIncome += t.amount;
      else group.usdIncome += t.amountUSD;
    } else if (t.type === "expense") {
      if (isNative) group.nativeExpense += t.amount;
      else group.usdExpense += t.amountUSD;
    }
  }

  return (
    <div className="flex flex-col">
      {groups.map((group) => {
        const net =
          group.nativeIncome -
          group.nativeExpense +
          convertUsd(group.usdIncome - group.usdExpense);
        const netTone = net >= 0 ? "pos" : "neg";
        return (
          <section key={group.date}>
            <div className="day-head">
              <span className="day-head-title">
                {formatDateHeader(group.date)}
              </span>
              <span className={`day-head-meta ${netTone}`}>
                {net >= 0 ? "+" : "−"}
                {(compact ? formatCurrencyCompact : formatCurrency)(
                  Math.abs(convertUsd(net)),
                  displayCurrency,
                )}
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
