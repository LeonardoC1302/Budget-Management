"use client";

import { useState } from "react";
import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import Modal from "@/components/atoms/Modal";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Account, Category, Transaction } from "@/lib/types";

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
  const isRefund = isIncome && !!transaction?.refundOf;
  const isExpense = transaction?.type === "expense";
  const refundable =
    isExpense && transaction ? transaction.amount - refunded > 0.005 : false;
  const isInflow =
    isIncome ||
    (isTransfer && transaction?.transferDirection === "in");

  const noun = isCardPayment
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
      (isTransfer ? "this transfer" : `this ${noun}`)
    : "";

  return (
    <>
      <Modal
        open={!!transaction && !confirmOpen}
        onClose={onClose}
        title="Transaction details"
      >
        {transaction && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 rounded-[10px] bg-surface-2 px-4 py-3">
              <span className="text-sm text-fg-subtle">Amount</span>
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
              <Row label="Type">
                {isCardPayment ? (
                  <span className="text-fg">Card payment</span>
                ) : isTransfer ? (
                  <span className="text-fg">Transfer</span>
                ) : isInvestment ? (
                  <span className="text-invest">Investment</span>
                ) : (
                  <span className={isIncome ? "text-income" : "text-expense"}>
                    {isRefund ? "Refund" : isIncome ? "Income" : "Expense"}
                  </span>
                )}
              </Row>
              {isTransfer ? (
                <>
                  <Row label="From">
                    {transaction.transferDirection === "out"
                      ? (account?.name ?? "—")
                      : (linkedAccount?.name ?? "—")}
                  </Row>
                  <Row label="To">
                    {transaction.transferDirection === "out"
                      ? (linkedAccount?.name ?? "—")
                      : (account?.name ?? "—")}
                  </Row>
                  {typeof transaction.fee === "number" && transaction.fee > 0 && (
                    <Row label="Fee">
                      {formatCurrency(transaction.fee, transaction.currency)}
                    </Row>
                  )}
                </>
              ) : (
                <>
                  <Row label="Category">{category?.name ?? "—"}</Row>
                  <Row label="Account">{account?.name ?? "—"}</Row>
                </>
              )}
              <Row label="Date">{formatDate(transaction.date)}</Row>
              {transaction.description && (
                <Row label="Description">{transaction.description}</Row>
              )}
              {isRefund && (
                <Row label="Refund of">
                  {refundOf
                    ? `${refundOf.description || "Expense"} · ${formatDate(refundOf.date)}`
                    : "A deleted expense"}
                </Row>
              )}
              {isExpense && refunded > 0 && (
                <Row label="Refunded">
                  <span className="text-income">
                    {formatCurrency(refunded, transaction.currency)}
                  </span>
                  {refunded + 0.005 < transaction.amount
                    ? ` of ${formatCurrency(transaction.amount, transaction.currency)}`
                    : " (full)"}
                </Row>
              )}
              {transaction.tags && transaction.tags.length > 0 && (
                <Row label="Tags">
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
                    Record refund
                  </Button>
                )}
                {onEdit && !isTransfer && !isInvestment && (
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => onEdit(transaction)}
                  >
                    Edit
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
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete this ${noun}?`}
        message={
          <>
            <span className="text-fg font-medium">{summaryLabel}</span> will
            be removed. Balances and monthly totals recalculate automatically.
          </>
        }
        confirmLabel="Delete"
        cancelLabel="Keep it"
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
