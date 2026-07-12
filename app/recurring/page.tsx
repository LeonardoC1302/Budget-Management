"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import Modal from "@/components/atoms/Modal";
import RecurringForm from "@/components/molecules/RecurringForm";
import RecurringList from "@/components/organisms/RecurringList";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import type {
  NewRecurringTransaction,
  RecurringTransaction,
} from "@/lib/types";

type Mode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; template: RecurringTransaction };

export default function RecurringPage() {
  const { recurring, loading, add, update, remove, toggleActive } =
    useRecurringTransactions();
  const { byId: accountsById } = useAccounts();
  const { byId: categoriesById } = useCategories();

  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RecurringTransaction | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  function close() {
    setMode({ kind: "closed" });
    setError(null);
  }

  async function handleSubmit(input: NewRecurringTransaction) {
    setError(null);
    try {
      if (mode.kind === "edit") {
        await update(mode.template.id, input);
      } else {
        await add(input);
      }
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save recurring");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await remove(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const active = recurring.filter((r) => r.active);
  const paused = recurring.filter((r) => !r.active);
  const pendingDeleteName = pendingDelete
    ? pendingDelete.description ||
      categoriesById[pendingDelete.categoryId]?.name ||
      "this recurring"
    : "";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="label-sm">Automations</span>
          <h1 className="heading-xl">Recurring</h1>
        </div>
        <Button size="md" onClick={() => setMode({ kind: "create" })}>
          + Add
        </Button>
      </header>

      {loading ? (
        <div className="surface p-8 text-center text-sm text-fg-muted">
          Loading…
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="label-sm">Active</h2>
            <RecurringList
              templates={active}
              accountsById={accountsById}
              categoriesById={categoriesById}
              onEdit={(template) => setMode({ kind: "edit", template })}
              onDelete={(id) =>
                setPendingDelete(recurring.find((r) => r.id === id) ?? null)
              }
              onToggleActive={toggleActive}
              emptyMessage="No active recurring items. Add one to auto-log salary, subscriptions, etc."
            />
          </section>

          {paused.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="label-sm">Paused</h2>
              <RecurringList
                templates={paused}
                accountsById={accountsById}
                categoriesById={categoriesById}
                onEdit={(template) => setMode({ kind: "edit", template })}
                onDelete={(id) =>
                  setPendingDelete(recurring.find((r) => r.id === id) ?? null)
                }
                onToggleActive={toggleActive}
              />
            </section>
          )}
        </>
      )}

      <Modal
        open={mode.kind !== "closed"}
        onClose={close}
        title={mode.kind === "edit" ? "Edit recurring" : "New recurring"}
      >
        <>
          {error && <div className="mb-4 text-sm text-expense">{error}</div>}
          {mode.kind !== "closed" && (
            <RecurringForm
              initial={mode.kind === "edit" ? mode.template : undefined}
              onSubmit={handleSubmit}
              onCancel={close}
            />
          )}
        </>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete recurring?"
        message={
          <>
            <span className="text-fg font-medium">{pendingDeleteName}</span>{" "}
            will stop creating future transactions. Past generated transactions
            are not touched.
          </>
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        submitting={deleting}
      />
    </div>
  );
}
