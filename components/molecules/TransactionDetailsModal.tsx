"use client";

import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import Modal from "@/components/atoms/Modal";
import { formatDate } from "@/lib/utils/format";
import type { Account, Category, Transaction } from "@/lib/types";

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  account?: Account;
  category?: Category;
  linkedAccount?: Account;
  onClose: () => void;
  onEdit?: (transaction: Transaction) => void;
}

export default function TransactionDetailsModal({
  transaction,
  account,
  category,
  linkedAccount,
  onClose,
  onEdit,
}: TransactionDetailsModalProps) {
  const isTransfer = transaction?.type === "transfer";
  const isIncome = transaction?.type === "income";
  const isInflow =
    isIncome ||
    (isTransfer && transaction?.transferDirection === "in");

  return (
    <Modal
      open={!!transaction}
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
                    : "expense"
              }
              size="lg"
              currency={transaction.currency}
              showSign={!isTransfer}
              className="text-right"
            />
          </div>

          <dl className="flex flex-col divide-y divide-border">
            <Row label="Type">
              {isTransfer ? (
                <span className="text-fg">Transfer</span>
              ) : (
                <span className={isIncome ? "text-income" : "text-expense"}>
                  {isIncome ? "Income" : "Expense"}
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
          </dl>

          {onEdit && !isTransfer && (
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => onEdit(transaction)}
            >
              Edit
            </Button>
          )}
        </div>
      )}
    </Modal>
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
