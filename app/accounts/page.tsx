"use client";

import { useMemo, useState } from "react";
import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import Modal from "@/components/atoms/Modal";
import RowSkeleton from "@/components/atoms/RowSkeleton";
import AccountForm from "@/components/molecules/AccountForm";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import TransferForm from "@/components/molecules/TransferForm";
import AccountList from "@/components/organisms/AccountList";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { TransferIcon } from "@/lib/action/icons";
import type { Account, NewAccount, NewTransfer } from "@/lib/types";

export default function AccountsPage() {
  const {
    accounts,
    balances,
    txCountByAccount,
    loading,
    add,
    update,
    remove,
    refresh: refreshAccounts,
  } = useAccounts();
  const { addTransfer } = useTransactions();

  const [modalOpen, setModalOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  async function handleTransfer(input: NewTransfer) {
    await addTransfer(input);
    await refreshAccounts();
    setTransferOpen(false);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setError(null);
    setDeleting(true);
    try {
      await remove(pendingDelete.id);
      setPendingDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account");
    } finally {
      setDeleting(false);
    }
  }

  const canTransfer = accounts.length >= 2;

  const balancesByCurrency = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of accounts) {
      const bal = balances[a.id] ?? a.initialBalance;
      map[a.currency] = (map[a.currency] ?? 0) + bal;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [accounts, balances]);

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead
        kicker="Manage"
        title="Accounts"
        actions={
          <>
            <Button
              size="md"
              variant="secondary"
              onClick={() => setTransferOpen(true)}
              disabled={!canTransfer}
              title={
                canTransfer
                  ? undefined
                  : "Add at least two accounts to enable transfers"
              }
            >
              <TransferIcon aria-hidden />
              <span>Transfer</span>
            </Button>
            <Button size="md" onClick={openCreate}>
              + Add
            </Button>
          </>
        }
      />

      {error && (
        <div className="surface border-expense/40 p-4 text-sm text-expense">
          {error}
        </div>
      )}

      {loading ? (
        <RowSkeleton count={3} />
      ) : (
        <>
          {accounts.length > 0 && (
            <section
              className="surface p-5 flex flex-col gap-3"
              aria-label="Net across accounts"
            >
              <div className="flex items-center justify-between">
                <span className="label-sm">Net across accounts</span>
                <span className="text-xs text-fg-subtle">
                  {accounts.length} account{accounts.length === 1 ? "" : "s"} &middot;{" "}
                  {balancesByCurrency.length} currenc
                  {balancesByCurrency.length === 1 ? "y" : "ies"}
                </span>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {balancesByCurrency.map(([currency, sum]) => (
                  <li
                    key={currency}
                    className="flex items-center justify-between py-2.5"
                  >
                    <span className="text-sm text-fg-muted">{currency}</span>
                    <Amount
                      value={sum}
                      tone={sum >= 0 ? "income" : "expense"}
                      size="md"
                      currency={currency}
                    />
                  </li>
                ))}
              </ul>
              <p className="text-xs text-fg-subtle">
                Balances are shown in each account&apos;s own currency — no conversion.
              </p>
            </section>
          )}

          <AccountList
          accounts={accounts}
          balances={balances}
          txCountByAccount={txCountByAccount}
          onEdit={openEdit}
          onDelete={setPendingDelete}
          emptyTitle="No accounts yet"
          emptyDescription="Add your first account so transactions have somewhere to land."
          emptyActionLabel="Add an account"
          emptyActionOnClick={openCreate}
        />
        </>
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

      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transfer between accounts"
      >
        <TransferForm
          onSubmit={handleTransfer}
          onCancel={() => setTransferOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this account?"
        message={
          pendingDelete && (
            <>
              <span className="text-fg font-medium">{pendingDelete.name}</span>{" "}
              will be removed. Its transactions stay in the ledger, unassigned
              — you can reassign them later.
            </>
          )
        }
        confirmLabel="Delete account"
        cancelLabel="Keep it"
        tone="danger"
        submitting={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
