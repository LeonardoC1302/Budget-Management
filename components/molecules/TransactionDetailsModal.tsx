"use client";

import { useState } from "react";
import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import Modal from "@/components/atoms/Modal";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Account, Category, Transaction } from "@/lib/types";

import { t } from "@/lib/i18n";
interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  account?: Account;
  category?: Category;
  linkedAccount?: Account;
  onClose: () => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void | Promise<void>;
  // Refunds: the expense this one reverses, or how much of this expense has
  // come back so far. `onRefund` offers "Record refund" on expenses.
  refundOf?: Transaction;
  refunded?: number;
  onRefund?: (transaction: Transaction) => void;
}

export default function TransactionDetailsModal({
  transaction,
  account,
  category,
  linkedAccount,
  onClose,
  onEdit,
  onDelete,
  refundOf,
  refunded = 0,
  onRefund,
}: TransactionDetailsModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isTransfer = transaction?.type === "transfer";
  const isCardPayment = isTransfer && !!transaction?.paymentForAccountId;
  const isIncome = transaction?.type === "income";
  const isInvestment = transaction?.type === "investment";
  const isAdjustment = !!transaction?.adjustment;
  const isRefund = isIncome && !!transaction?.refundOf && !isAdjustment;
  const isExpense = transaction?.type === "expense" && !isAdjustment;
  const refundable =
    isExpense && transaction ? transaction.amount - refunded > 0.005 : false;
  const isInflow =
    isIncome ||
    (isTransfer && transaction?.transferDirection === "in");

  const kind = isAdjustment
    ? "adjustment"
    : isCardPayment
      ? "card payment"
      : isTransfer
        ? "transfer"
        : isInvestment
          ? "investment"
          : isRefund
            ? "refund"
            : isIncome
              ? "income entry"
              : "expense";
  // Whole sentences per kind so each language can agree on gender.
  const DELETE_TITLES: Record<typeof kind, string> = {
    adjustment: "Delete this adjustment?",
    "card payment": "Delete this card payment?",
    transfer: "Delete this transfer?",
    investment: "Delete this investment?",
    refund: "Delete this refund?",
    "income entry": "Delete this income entry?",
    expense: "Delete this expense?",
  };

  async function handleConfirmDelete() {
    if (!transaction || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(transaction.id);
      setConfirmOpen(false);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  const summaryLabel = transaction
    ? transaction.description ||
      category?.name ||
      (isTransfer ? t("this transfer") : t("this " + kind))
    : "";

  return (
    <>
      <Modal
        open={!!transaction && !confirmOpen}
        onClose={onClose}
        title={t("Transaction details")}
      >
        {transaction && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 rounded-[10px] bg-surface-2 px-4 py-3">
              <span className="text-sm text-fg-subtle">{t("Amount")}</span>
              <Amount
                value={transaction.amount}
                tone={
                  isTransfer
                    ? isInflow
                      ? "income"
                      : "expense"
                    : isIncome
                      ? "income"
                      : isInvestment
                        ? "neutral"
                        : "expense"
                }
                size="lg"
                currency={transaction.currency}
                showSign={!isTransfer && !isInvestment}
                className={isInvestment ? "text-invest text-right" : "text-right"}
              />
            </div>

            <dl className="flex flex-col divide-y divide-border">
              <Row label={t("Type")}>
                {isCardPayment ? (
                  <span className="text-fg">{t("Card payment")}</span>
                ) : isTransfer ? (
                  <span className="text-fg">{t("Transfer")}</span>
                ) : isInvestment ? (
                  <span className="text-invest">{t("Investment")}</span>
                ) : isAdjustment ? (
                  <span className="text-fg">{t("Balance adjustment")}</span>
                ) : (
                  <span className={isIncome ? "text-income" : "text-expense"}>
                    {isRefund ? t("Refund") : isIncome ? t("Income") : t("Expense")}
                  </span>
                )}
              </Row>
              {isTransfer ? (
                <>
                  <Row label={t("From")}>
                    {transaction.transferDirection === "out"
                      ? (account?.name ?? "—")
                      : (linkedAccount?.name ?? "—")}
                  </Row>
                  <Row label={t("To")}>
                    {transaction.transferDirection === "out"
                      ? (linkedAccount?.name ?? "—")
                      : (account?.name ?? "—")}
                  </Row>
                  {typeof transaction.fee === "number" && transaction.fee > 0 && (
                    <Row label={t("Fee")}>
                      {formatCurrency(transaction.fee, transaction.currency)}
                    </Row>
                  )}
                </>
              ) : (
                <>
                  <Row label={t("Category")}>{category?.name ?? "—"}</Row>
                  <Row label={t("Account")}>{account?.name ?? "—"}</Row>
                </>
              )}
              <Row label={t("Date")}>{formatDate(transaction.date)}</Row>
              {transaction.description && (
                <Row label={t("Description")}>{transaction.description}</Row>
              )}
              {isRefund && (
                <Row label={t("Refund of")}>
                  {refundOf
                    ? `${refundOf.description || t("Expense")} · ${formatDate(refundOf.date)}`
                    : t("A deleted expense")}
                </Row>
              )}
              {isExpense && refunded > 0 && (
                <Row label={t("Refunded")}>
                  <span className="text-income">
                    {formatCurrency(refunded, transaction.currency)}
                  </span>
                  {refunded + 0.005 < transaction.amount
                    ? ` of ${formatCurrency(transaction.amount, transaction.currency)}`
                    : t(" (full)")}
                </Row>
              )}
              {isInvestment && typeof transaction.fee === "number" && transaction.fee > 0 && (
                <Row label={t("Commission")}>
                  {formatCurrency(transaction.fee, transaction.currency)}
                  {" · "}
                  {t("{amount} invested", {
                    amount: formatCurrency(transaction.amount - transaction.fee, transaction.currency),
                  })}
                </Row>
              )}
              {transaction.installment && (
                <Row label={t("Installment")}>
                  {t("{index} of {count} · {total} total", {
                    index: transaction.installment.index,
                    count: transaction.installment.count,
                    total: formatCurrency(transaction.installment.total, transaction.currency),
                  })}
                </Row>
              )}
              {transaction.tags && transaction.tags.length > 0 && (
                <Row label={t("Tags")}>
                  {transaction.tags.map((t) => `#${t}`).join(" ")}
                </Row>
              )}
            </dl>

            {(onEdit || onDelete || onRefund) && (
              <div className="flex flex-col gap-2">
                {onRefund && refundable && (
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => onRefund(transaction)}
                  >
                    {t("Record refund")}
                  </Button>
                )}
                {onEdit && !isTransfer && !isInvestment && !isAdjustment && (
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => onEdit(transaction)}
                  >
                    {t("Edit")}
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="md"
                    fullWidth
                    onClick={() => setConfirmOpen(true)}
                    className="text-expense hover:text-bg hover:bg-expense"
                  >
                    {t("Delete")}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={t(DELETE_TITLES[kind])}
        message={
          <>
            <span className="text-fg font-medium">{summaryLabel}</span>
            {transaction?.installment
              ? t(" and all {count} of its installments will be removed.", { count: transaction.installment.count })
              : t(" will be removed.")}{" "}
            {t("Balances and monthly totals recalculate automatically.")}
          </>
        }
        confirmLabel={t("Delete")}
        cancelLabel={t("Keep it")}
        tone="danger"
        submitting={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="text-fg text-right">{children}</dd>
    </div>
  );
}
