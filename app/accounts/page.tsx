"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import Modal from "@/components/atoms/Modal";
import AccountForm from "@/components/molecules/AccountForm";
import AccountList from "@/components/organisms/AccountList";
import { useAccounts } from "@/hooks/useAccounts";
import type { Account, NewAccount } from "@/lib/types";

export default function AccountsPage() {
  const { accounts, balances, txCountByAccount, loading, add, update, remove } =
    useAccounts();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(account: Account) {
    setEditing(account);
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(input: NewAccount) {
    if (editing) {
      await update(editing.id, input);
    } else {
      await add(input);
    }
    setModalOpen(false);
    setEditing(null);
  }

  async function handleDelete(account: Account) {
    setError(null);
    try {
      await remove(account.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="label-sm">Manage</span>
          <h1 className="heading-xl">Accounts</h1>
        </div>
        <Button size="md" onClick={openCreate}>
          + Add
        </Button>
      </header>

      {error && (
        <div className="surface border-expense/40 p-4 text-sm text-expense">
          {error}
        </div>
      )}

      {loading ? (
        <div className="surface p-8 text-center text-sm text-fg-muted">
          Loading…
        </div>
      ) : (
        <AccountList
          accounts={accounts}
          balances={balances}
          txCountByAccount={txCountByAccount}
          onEdit={openEdit}
          onDelete={handleDelete}
          emptyMessage="No accounts yet. Add one to start tracking."
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit account" : "New account"}
      >
        <AccountForm
          initial={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
