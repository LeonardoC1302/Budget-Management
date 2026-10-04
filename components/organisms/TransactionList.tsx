"use client";

import EmptyState from "@/components/atoms/EmptyState";
import TransactionItem from "@/components/molecules/TransactionItem";
import { usePreferences } from "@/contexts/PreferencesContext";
import { formatDateHeader } from "@/lib/utils/format";
import { formatCurrencyCompact, formatCurrency } from "@/lib/utils/format";
import type { Account, Category, Transaction } from "@/lib/types";
import { countsAsIncome, spendSign } from "@/lib/utils/refunds";

import { t } from "@/lib/i18n";
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
  emptyMessage = t("No transactions yet."),
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

  // Each day's net: income minus spending, with refunds lowering spending and
  // reconcile adjustments left out, the same rules as the rest of the app.
  // Amounts already in displayCurrency are summed as-is; the rest use their
  // USD value, converted once below.
  const groups: {
    date: string;
    native: number;
    usd: number;
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
              native: 0,
              usd: 0,
              items: [] as Transaction[],
            };
            groups.push(g);
            return g;
          })();
    group.items.push(t);
    const sign = countsAsIncome(t) ? 1 : -spendSign(t);
    if (sign === 0) continue;
    if (isNative) group.native += sign * t.amount;
    else group.usd += sign * t.amountUSD;
  }

  return (
    <div className="flex flex-col">
      {groups.map((group) => {
        // Already in displayCurrency.
        const net = group.native + convertUsd(group.usd);
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
                  Math.abs(net),
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
