"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import Modal from "@/components/atoms/Modal";
import RowSkeleton from "@/components/atoms/RowSkeleton";
import BudgetForm from "@/components/molecules/BudgetForm";
import BudgetSummary from "@/components/molecules/BudgetSummary";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import BudgetList from "@/components/organisms/BudgetList";
import { useBudgets } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { formatMonthLabel } from "@/lib/utils/budgets";
import type { Budget, NewBudget } from "@/lib/types";

type Mode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; budget: Budget };

export default function BudgetsPage() {
  const {
    budgets,
    progressByCategory,
    totals,
    monthKey,
    loading,
    add,
    update,
    remove,
  } = useBudgets();
  const { byId: categoriesById } = useCategories();

  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);

  function close() {
    setMode({ kind: "closed" });
    setError(null);
  }

  async function handleSubmit(input: NewBudget) {
    setError(null);
    try {
      if (mode.kind === "edit") {
        await update(mode.budget.id, input);
      } else {
        await add(input);
      }
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save budget");
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

  const usedCategoryIds = budgets.map((b) => b.categoryId);
  const currency = budgets[0]?.currency ?? "USD";
  const pendingDeleteName = pendingDelete
    ? categoriesById[pendingDelete.categoryId]?.name ?? "this budget"
    : "";

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead
        kicker={formatMonthLabel(monthKey)}
        title="Budgets"
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
          {budgets.length > 0 && (
            <BudgetSummary totals={totals} currency={currency} />
          )}

          <BudgetList
            budgets={budgets}
            categoriesById={categoriesById}
            progressByCategory={progressByCategory}
            onEdit={(budget) => setMode({ kind: "edit", budget })}
            onDelete={(budget) => setPendingDelete(budget)}
            emptyTitle="No budgets yet"
            emptyDescription="Set a monthly cap on a category so you can catch trends before the end of the month."
            emptyActionLabel="Add a monthly cap"
            emptyActionOnClick={() => setMode({ kind: "create" })}
          />
        </>
      )}

      <Modal
        open={mode.kind !== "closed"}
        onClose={close}
        title={mode.kind === "edit" ? "Edit budget" : "New budget"}
      >
        <>
          {error && (
            <div className="mb-4 text-sm text-expense">{error}</div>
          )}
          {mode.kind !== "closed" && (
            <BudgetForm
              initial={mode.kind === "edit" ? mode.budget : undefined}
              usedCategoryIds={usedCategoryIds}
              onSubmit={handleSubmit}
              onCancel={close}
            />
          )}
        </>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete budget?"
        message={
          <>
            The monthly cap for{" "}
            <span className="text-fg font-medium">{pendingDeleteName}</span>{" "}
            will be removed. Your transactions won&apos;t be touched.
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
