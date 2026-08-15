"use client";

import { useMemo, useState } from "react";
import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import Modal from "@/components/atoms/Modal";
import ProgressBar from "@/components/atoms/ProgressBar";
import RowSkeleton from "@/components/atoms/RowSkeleton";
import ContributionForm from "@/components/molecules/ContributionForm";
import GoalForm from "@/components/molecules/GoalForm";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import GoalList from "@/components/organisms/GoalList";
import { useAccounts } from "@/hooks/useAccounts";
import { useGoals } from "@/hooks/useGoals";
import type { Goal, NewGoal, NewGoalContribution } from "@/lib/types";

type Mode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; goal: Goal }
  | { kind: "contribute"; goal: Goal };

export default function GoalsPage() {
  const {
    goals,
    contributionsByGoal,
    monthlyRate,
    loading,
    addGoal,
    updateGoal,
    removeGoal,
    addContribution,
  } = useGoals();
  const { accounts, balances, reservationsByAccount } = useAccounts();

  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);

  function close() {
    setMode({ kind: "closed" });
  }

  async function handleGoalSubmit(input: NewGoal) {
    if (mode.kind === "edit") {
      await updateGoal(mode.goal.id, input);
    } else {
      await addGoal(input);
    }
    close();
  }

  async function handleContributionSubmit(input: NewGoalContribution) {
    await addContribution(input);
    close();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await removeGoal(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const modalTitle =
    mode.kind === "create"
      ? "New goal"
      : mode.kind === "edit"
        ? "Edit goal"
        : mode.kind === "contribute"
          ? `Contribute to ${mode.goal.name}`
          : "";

  const totalsByCurrency = useMemo(() => {
    const map: Record<string, { saved: number; target: number }> = {};
    for (const g of goals) {
      const contribs = contributionsByGoal[g.id] ?? [];
      const saved =
        g.initialAmount + contribs.reduce((s, c) => s + c.amount, 0);
      if (!map[g.currency]) map[g.currency] = { saved: 0, target: 0 };
      map[g.currency].saved += saved;
      map[g.currency].target += g.targetAmount;
    }
    return Object.entries(map)
      .map(([currency, sums]) => ({
        currency,
        saved: sums.saved,
        target: sums.target,
        percent: sums.target > 0 ? Math.min(sums.saved / sums.target, 1) : 0,
      }))
      .sort((a, b) => b.target - a.target);
  }, [goals, contributionsByGoal]);

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead
        kicker="Plan"
        title="Saving goals"
        actions={
          <Button size="md" onClick={() => setMode({ kind: "create" })}>
            + Add
          </Button>
        }
      />

      {loading ? (
        <RowSkeleton count={3} />
      ) : (
        <>
          {goals.length > 0 && (
            <section
              className="flex flex-col"
              aria-label="Total saved across goals"
            >
              <div className="section-head">
                <span className="section-head-title">Total saved</span>
                <span className="section-head-meta">
                  {goals.length} goal{goals.length === 1 ? "" : "s"} · {totalsByCurrency.length} currenc
                  {totalsByCurrency.length === 1 ? "y" : "ies"}
                </span>
              </div>
              <div className="rooms">
                {totalsByCurrency.map((row) => (
                  <div key={row.currency} className="px-4 py-3 flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                        <Amount
                          value={row.saved}
                          tone="neutral"
                          size="lg"
                          currency={row.currency}
                          className="font-serif"
                        />
                        <span className="text-[11px] text-fg-muted uppercase tracking-[0.14em]">
                          of {row.target.toLocaleString("en-US")} {row.currency}
                        </span>
                      </div>
                      <span className="figure text-xs text-fg-muted shrink-0">
                        {Math.round(row.percent * 100)}%
                      </span>
                    </div>
                    <ProgressBar
                      value={row.percent}
                      tone="accent"
                      ariaLabel={`${row.currency} saved progress`}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col" aria-label="Goals">
            <div className="section-head">
              <span className="section-head-title">Goals</span>
              <span className="section-head-meta">Saving toward</span>
            </div>
            <GoalList
              goals={goals}
              contributionsByGoal={contributionsByGoal}
              monthlyRate={monthlyRate}
              onContribute={(goal) => setMode({ kind: "contribute", goal })}
              onEdit={(goal) => setMode({ kind: "edit", goal })}
              onDelete={(goal) => setPendingDelete(goal)}
              emptyTitle="No goals yet."
              emptyDescription="Name something you're saving for and Perch will track your monthly pace toward it."
              emptyActionLabel="Create a goal"
              emptyActionOnClick={() => setMode({ kind: "create" })}
            />
          </section>
        </>
      )}

      <Modal open={mode.kind !== "closed"} onClose={close} title={modalTitle}>
        {mode.kind === "contribute" ? (
          <ContributionForm
            goalId={mode.goal.id}
            goalCurrency={mode.goal.currency}
            accounts={accounts}
            balances={balances}
            reservationsByAccount={reservationsByAccount}
            onSubmit={handleContributionSubmit}
            onCancel={close}
          />
        ) : mode.kind === "closed" ? null : (
          <GoalForm
            initial={mode.kind === "edit" ? mode.goal : undefined}
            onSubmit={handleGoalSubmit}
            onCancel={close}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete goal?"
        message={
          pendingDelete && (
            <>
              This will permanently delete{" "}
              <span className="text-fg font-medium">
                &ldquo;{pendingDelete.name}&rdquo;
              </span>{" "}
              and all of its contributions. This can&apos;t be undone.
            </>
          )
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        submitting={deleting}
      />
    </div>
  );
}
