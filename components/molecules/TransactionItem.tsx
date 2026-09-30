"use client";

import Amount from "@/components/atoms/Amount";
import { usePreferences } from "@/contexts/PreferencesContext";
import { RefreshIcon } from "@/lib/action/icons";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import type { Account, Category, Transaction } from "@/lib/types";

import { getLocale, t } from "@/lib/i18n";
interface TransactionItemProps {
  transaction: Transaction;
  account?: Account;
  category?: Category;
  linkedAccount?: Account;
  onSelect?: (transaction: Transaction) => void;
  /** Collapsed view for transfers: shows source → destination on a single row. */
  groupedTransfer?: boolean;
  /** Hide the date column when the list already groups by day. */
  hideDate?: boolean;
  /** Preview surfaces (home page recent activity) use compact notation. */
  compact?: boolean;
}

function shortDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    .toLocaleDateString(getLocale(), { month: "short", day: "numeric" });
}

/**
 * Alcove entry — date | title + note | amount, three columns on a hairline.
 * Semantic tone lives on the amount; the type is signaled by the small
 * colored dot before the title.
 */
export default function TransactionItem({
  transaction,
  account,
  category,
  linkedAccount,
  onSelect,
  groupedTransfer = false,
  hideDate = false,
  compact = false,
}: TransactionItemProps) {
  const { displayCurrency, convertUsd } = usePreferences();
  const isTransfer = transaction.type === "transfer";
  const isIncome = transaction.type === "income";
  const isInvestment = transaction.type === "investment";
  const isInflow =
    isIncome || (isTransfer && transaction.transferDirection === "in");

  let title: string;
  let subtitle: string;
  let tone: "income" | "expense" | "neutral";
  let dotClass = "text-fg-subtle";

  if (isTransfer) {
    const other = linkedAccount?.name ?? t("another account");
    const isCardPayment = !!transaction.paymentForAccountId;
    const cardName =
      transaction.transferDirection === "in"
        ? account?.name
        : linkedAccount?.name;
    if (groupedTransfer) {
      const source =
        transaction.transferDirection === "in"
          ? linkedAccount?.name
          : account?.name;
      const destination =
        transaction.transferDirection === "in"
          ? account?.name
          : linkedAccount?.name;
      title =
        transaction.description ||
        (isCardPayment ? t("Card payment") : t("Transfer"));
      subtitle = `${source ?? "—"} → ${destination ?? "—"}`;
    } else {
      const defaultTitle = isCardPayment
        ? t("Card payment · {0}", { "0": cardName ?? other })
        : transaction.transferDirection === "in"
          ? t("Transfer from {other}", { other })
          : t("Transfer to {other}", { other });
      title = transaction.description || defaultTitle;
      subtitle = account?.name ?? "—";
    }
    tone = "neutral";
    dotClass = "text-fg-subtle";
  } else if (isInvestment) {
    title = transaction.description || category?.name || t("Investment");
    subtitle = [category?.name, account?.name].filter(Boolean).join(" · ");
    tone = "neutral";
    dotClass = "text-invest";
  } else if (transaction.adjustment) {
    title = transaction.description || t("Balance adjustment");
    subtitle = ["Adjustment", account?.name].filter(Boolean).join(" · ");
    tone = isIncome ? "income" : "expense";
    dotClass = "text-fg-subtle";
  } else {
    const isRefund = isIncome && !!transaction.refundOf;
    title =
      transaction.description ||
      (isRefund ? t("Refund") : category?.name) ||
      t("Untitled");
    if (transaction.installment) {
      title += ` · ${transaction.installment.index}/${transaction.installment.count}`;
    }
    subtitle = [isRefund ? "Refund" : null, category?.name, account?.name]
      .filter(Boolean)
      .join(" · ");
    tone = isIncome ? "income" : "expense";
    dotClass = isIncome ? "text-income" : "text-expense";
  }

  const body = (
    <>
      {!hideDate && (
        <div className="entry-date">{shortDate(transaction.date)}</div>
      )}
      <div className={cn("entry-body flex items-center gap-2", hideDate && "col-span-2")}>
        <span
          aria-hidden
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotClass)}
          style={{ background: "currentColor" }}
        />
        <div className="min-w-0 flex-1">
          <div className="entry-title flex items-center gap-1.5">
            <span className="truncate">{title}</span>
            {transaction.recurringId && (
              <RefreshIcon
                width={12}
                height={12}
                aria-label={t("From a recurring rule")}
                className="text-fg-subtle shrink-0"
              />
            )}
          </div>
          <div className="entry-note">
            {subtitle} {!hideDate ? "" : `· ${formatDate(transaction.date)}`}
            {transaction.tags && transaction.tags.length > 0 && (
              <span className="text-fg-subtle">
                {" "}
                · {transaction.tags.map((t) => `#${t}`).join(" ")}
              </span>
            )}
          </div>
        </div>
      </div>
      <Amount
        value={
          transaction.currency === displayCurrency
            ? transaction.amount
            : convertUsd(transaction.amountUSD)
        }
        tone={tone}
        size="md"
        currency={displayCurrency}
        compact={compact}
        showSign={!isTransfer && !isInvestment}
        className={cn(
          "entry-amt shrink-0",
          isTransfer &&
            !groupedTransfer &&
            (isInflow ? "text-income" : "text-expense"),
          isTransfer && groupedTransfer && "text-fg-muted",
          isInvestment && "text-invest",
        )}
      />
    </>
  );

  const grid = hideDate ? "grid-cols-[1fr_auto]" : "grid-cols-[56px_1fr_auto]";

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(transaction)}
        className={cn(
          "entry text-left w-full transition-colors hover:bg-surface-2",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
          grid,
        )}
      >
        {body}
      </button>
    );
  }
  return <div className={cn("entry", grid)}>{body}</div>;
}
