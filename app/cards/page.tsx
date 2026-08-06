"use client";

import { useMemo, useState } from "react";
import Button from "@/components/atoms/Button";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import EmptyState from "@/components/atoms/EmptyState";
import Modal from "@/components/atoms/Modal";
import RowSkeleton from "@/components/atoms/RowSkeleton";
import CardForm from "@/components/molecules/CardForm";
import PayCardForm from "@/components/molecules/PayCardForm";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import CardDetailPanel from "@/components/organisms/CardDetailPanel";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { computeCardHistory } from "@/lib/credit/statement";
import type { Account, NewAccount, NewTransfer } from "@/lib/types";

export default function CardsPage() {
  const {
    accounts,
    byId: accountsById,
    txCountByAccount,
    creditTotalsByAccount,
    loading,
    add,
    update,
    remove,
    refresh: refreshAccounts,
  } = useAccounts();
  const { byId: categoriesById } = useCategories();
  const { transactions, addTransfer } = useTransactions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [payingCard, setPayingCard] = useState<Account | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cards = useMemo(
    () => accounts.filter((a) => a.type === "credit"),
    [accounts],
  );

  const historiesByCard = useMemo(() => {
    const now = new Date();
    const out: Record<string, ReturnType<typeof computeCardHistory>> = {};
    for (const card of cards) {
      out[card.id] = computeCardHistory(card, transactions, now);
    }
    return out;
  }, [cards, transactions]);

  function openCreate() {
    setEditing(null);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(card: Account) {
    setEditing(card);
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

  async function handlePay(input: NewTransfer) {
    await addTransfer(input);
    await refreshAccounts();
    setPayingCard(null);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setError(null);
    setDeleting(true);
    try {
      await remove(pendingDelete.id);
      setPendingDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete card");
    } finally {
      setDeleting(false);
    }
  }

  const payingTotals = payingCard ? creditTotalsByAccount[payingCard.id] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead
        kicker="Manage"
        title="Cards"
        actions={
          <Button size="md" onClick={openCreate}>
            + Add
          </Button>
        }
      />

      {error && (
        <div className="surface border-expense/40 p-4 text-sm text-expense">
          {error}
        </div>
      )}

      {loading ? (
        <RowSkeleton count={2} />
      ) : cards.length === 0 ? (
        <EmptyState
          title="No credit cards yet"
          description="Add a card with its cut and payment days and Perch will track statements, unbilled charges, and what to pay when."
          actionLabel="Add a card"
          actionOnClick={openCreate}
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {cards.map((card) => (
            <li key={card.id}>
              <CardDetailPanel
                card={card}
                totals={creditTotalsByAccount[card.id]}
                history={historiesByCard[card.id] ?? undefined}
                accountsById={accountsById}
                categoriesById={categoriesById}
                transactionCount={txCountByAccount[card.id] ?? 0}
                onEdit={openEdit}
                onDelete={setPendingDelete}
                onPay={setPayingCard}
              />
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit card" : "New card"}
      >
        <CardForm
          initial={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <Modal
        open={!!payingCard && !!payingTotals}
        onClose={() => setPayingCard(null)}
        title={payingCard ? `Pay ${payingCard.name}` : "Pay card"}
      >
        {payingCard && payingTotals && (
          <PayCardForm
            card={payingCard}
            totals={payingTotals}
            onSubmit={handlePay}
            onCancel={() => setPayingCard(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this card?"
        message={
          pendingDelete && (
            <>
              <span className="text-fg font-medium">{pendingDelete.name}</span>{" "}
              will be removed. Its transactions stay in the ledger, unassigned —
              you can reassign them later.
            </>
          )
        }
        confirmLabel="Delete card"
        cancelLabel="Keep it"
        tone="danger"
        submitting={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
