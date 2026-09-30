"use client";

import { useState } from "react";
import BudgetHistoryChart from "@/components/atoms/BudgetHistoryChart";
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
import { currentMonthKey, formatMonthLabel } from "@/lib/utils/budgets";
import type { Budget, NewBudget } from "@/lib/types";

type Mode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; budget: Budget };

function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function BudgetsPage() {
  const thisMonth = currentMonthKey();
  const [viewMonth, setViewMonth] = useState(thisMonth);
  const isCurrentMonth = viewMonth === thisMonth;
  const {
    budgets,
    history,
    progressByCategory,
    totals,
    summaryCurrency,
    monthKey,
    loading,
    add,
    update,
    remove,
  } = useBudgets(viewMonth);
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
            <nav
              aria-label="Choose month"
              className="flex items-center justify-between gap-3"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMonth(shiftMonth(viewMonth, -1))}
                aria-label="Previous month"
              >
                ← {formatMonthLabel(shiftMonth(viewMonth, -1)).split(" ")[0]}
              </Button>
              <span className="text-sm text-fg font-medium">
                {formatMonthLabel(monthKey)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setViewMonth(
                    isCurrentMonth ? viewMonth : shiftMonth(viewMonth, 1),
                  )
                }
                disabled={isCurrentMonth}
                aria-label="Next month"
              >
                {isCurrentMonth
                  ? "Now"
                  : `${formatMonthLabel(shiftMonth(viewMonth, 1)).split(" ")[0]} →`}
              </Button>
            </nav>
          )}

          {budgets.length > 0 && (
            <BudgetSummary
              totals={totals}
              currency={summaryCurrency}
              label={isCurrentMonth ? "Spent this month" : `Spent in ${formatMonthLabel(monthKey)}`}
            />
          )}

          {budgets.length > 0 && (
            <section className="surface p-5 flex flex-col gap-3" aria-label="Budget history">
              <span className="label-sm">Last {history.length} months</span>
              <BudgetHistoryChart
                data={history.map((h) => ({
                  monthKey: h.monthKey,
                  spent: h.spent,
                  cap: h.cap,
                }))}
                currency={summaryCurrency}
                selected={monthKey}
                onSelect={setViewMonth}
              />
              {budgets.some((b) => b.capHistory?.length) ? null : (
                <p className="text-[11px] text-fg-subtle">
                  Earlier months are compared with your caps as they are
                  today. From now on, changing a cap keeps the old amount for
                  past months.
                </p>
              )}
            </section>
          )}

          <BudgetList
            budgets={budgets}
            categoriesById={categoriesById}
            progressByCategory={progressByCategory}
            isCurrentMonth={isCurrentMonth}
            history={history}
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
