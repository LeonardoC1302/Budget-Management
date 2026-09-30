"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import Modal from "@/components/atoms/Modal";
import RowSkeleton from "@/components/atoms/RowSkeleton";
import RecurringContributionForm from "@/components/molecules/RecurringContributionForm";
import RecurringForm from "@/components/molecules/RecurringForm";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import RecurringList from "@/components/organisms/RecurringList";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useHoldings } from "@/hooks/useHoldings";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import type {
  NewRecurringTransaction,
  RecurringTransaction,
} from "@/lib/types";

import { t, tn } from "@/lib/i18n";
type Mode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "create-investment" }
  | { kind: "edit"; template: RecurringTransaction };

export default function RecurringPage() {
  const { recurring, loading, add, update, remove, toggleActive } =
    useRecurringTransactions();
  const { byId: accountsById } = useAccounts();
  const { byId: categoriesById } = useCategories();
  const { holdings } = useHoldings();

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
      setError(err instanceof Error ? err.message : t("Could not save recurring"));
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
      t("this recurring")
    : "";

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead
        kicker={t("Automations")}
        title={t("Recurring")}
        actions={
          <>
            {holdings.length > 0 && (
              <Button
                size="md"
                variant="secondary"
                onClick={() => setMode({ kind: "create-investment" })}
              >
                {t("+ Investment")}
              </Button>
            )}
            <Button size="md" onClick={() => setMode({ kind: "create" })}>
              {t("+ Add")}
            </Button>
          </>
        }
      />

      {loading ? (
        <RowSkeleton count={4} />
      ) : (
        <>
          <section className="flex flex-col" aria-labelledby="recurring-active">
            <div className="section-head">
              <span id="recurring-active" className="section-head-title">
                {t("Active")}
              </span>
              <span className="section-head-meta">
                {tn("{count} rule", "{count} rules", active.length)}
              </span>
            </div>
            <RecurringList
              templates={active}
              accountsById={accountsById}
              categoriesById={categoriesById}
              onEdit={(template) => setMode({ kind: "edit", template })}
              onDelete={(id) =>
                setPendingDelete(recurring.find((r) => r.id === id) ?? null)
              }
              onToggleActive={toggleActive}
              emptyTitle={t("No recurring rules yet.")}
              emptyDescription={t("Automate the shape of a normal month — salary, rent, subscriptions — so you only enter the surprises.")}
              emptyActionLabel={t("Add a recurring rule")}
              emptyActionOnClick={() => setMode({ kind: "create" })}
            />
          </section>

          {paused.length > 0 && (
            <section
              className="flex flex-col"
              aria-labelledby="recurring-paused"
            >
              <div className="section-head">
                <span id="recurring-paused" className="section-head-title">
                  {t("Paused")}
                </span>
                <span className="section-head-meta">
                  {tn("{count} rule", "{count} rules", paused.length)}
                </span>
              </div>
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
        title={
          mode.kind === "create-investment"
            ? t("New recurring contribution")
            : mode.kind === "edit"
              ? t("Edit recurring")
              : t("New recurring")
        }
      >
        <>
          {error && <div className="mb-4 text-sm text-expense">{error}</div>}
          {mode.kind === "create-investment" ||
          (mode.kind === "edit" && mode.template.type === "investment") ? (
            <RecurringContributionForm
              holdings={holdings}
              initial={mode.kind === "edit" ? mode.template : undefined}
              onSubmit={handleSubmit}
              onCancel={close}
            />
          ) : (
            mode.kind !== "closed" && (
              <RecurringForm
                initial={mode.kind === "edit" ? mode.template : undefined}
                onSubmit={handleSubmit}
                onCancel={close}
              />
            )
          )}
        </>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("Delete recurring?")}
        message={
          <>
            <span className="text-fg font-medium">{pendingDeleteName}</span>{" "}
            {t("will stop creating future transactions. Past generated transactions are not touched.")}
          </>
        }
        confirmLabel={t("Delete")}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        submitting={deleting}
      />
    </div>
  );
}
