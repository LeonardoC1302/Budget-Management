"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import Modal from "@/components/atoms/Modal";
import RowSkeleton from "@/components/atoms/RowSkeleton";
import RecurringForm from "@/components/molecules/RecurringForm";
import RouteMasthead from "@/components/molecules/RouteMasthead";
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
      <RouteMasthead
        kicker="Automations"
        title="Recurring"
        actions={
          <Button size="md" onClick={() => setMode({ kind: "create" })}>
            + Add
          </Button>
        }
      />

      {loading ? (
        <RowSkeleton count={4} />
      ) : (
        <>
          <section className="flex flex-col gap-3" aria-labelledby="recurring-active">
            <h2
              id="recurring-active"
              className="heading-lg flex items-baseline gap-2"
            >
              <span>Active</span>
              {active.length > 0 && (
                <span className="text-sm font-normal text-fg-subtle tabular-nums">
                  {active.length}
                </span>
              )}
            </h2>
            <RecurringList
              templates={active}
              accountsById={accountsById}
              categoriesById={categoriesById}
              onEdit={(template) => setMode({ kind: "edit", template })}
              onDelete={(id) =>
                setPendingDelete(recurring.find((r) => r.id === id) ?? null)
              }
              onToggleActive={toggleActive}
              emptyTitle="No recurring rules yet"
              emptyDescription="Automate the shape of a normal month — salary, rent, subscriptions — so you only enter the surprises."
              emptyActionLabel="Add a recurring rule"
              emptyActionOnClick={() => setMode({ kind: "create" })}
            />
          </section>

          {paused.length > 0 && (
            <section
              className="flex flex-col gap-3"
              aria-labelledby="recurring-paused"
            >
              <h2
                id="recurring-paused"
                className="heading-lg flex items-baseline gap-2 text-fg-muted"
              >
                <span>Paused</span>
                <span className="text-sm font-normal text-fg-subtle tabular-nums">
                  {paused.length}
                </span>
              </h2>
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
