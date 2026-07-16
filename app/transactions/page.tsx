"use client";

import { useState } from "react";
import Modal from "@/components/atoms/Modal";
import TransactionDetailsModal from "@/components/molecules/TransactionDetailsModal";
import TransactionForm from "@/components/molecules/TransactionForm";
import TransactionList from "@/components/organisms/TransactionList";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction } from "@/lib/types";

export default function TransactionsPage() {
  const { transactions, remove, update, loading } = useTransactions();
  const { byId: accountsById } = useAccounts();
  const { byId: categoriesById } = useCategories();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="label-sm">History</span>
        <h1 className="heading-xl">All transactions</h1>
      </header>

      {loading ? (
        <div className="surface p-8 text-center text-sm text-fg-muted">
          Loading…
        </div>
      ) : (
        <TransactionList
          transactions={transactions}
          accountsById={accountsById}
          categoriesById={categoriesById}
          onDelete={remove}
          onSelect={setSelected}
        />
      )}

      <TransactionDetailsModal
        transaction={selected}
        account={selected ? accountsById[selected.accountId] : undefined}
        category={selected ? categoriesById[selected.categoryId] : undefined}
        linkedAccount={
          selected?.linkedAccountId
            ? accountsById[selected.linkedAccountId]
            : undefined
        }
        onClose={() => setSelected(null)}
        onEdit={(t) => {
          setSelected(null);
          setEditing(t);
        }}
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit transaction"
      >
        {editing && (
          <TransactionForm
            initial={editing}
            onSubmit={async (input) => {
              await update(editing.id, input);
              setEditing(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
