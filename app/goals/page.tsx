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
              className="surface p-5 flex flex-col gap-3"
              aria-label="Total saved across goals"
            >
              <div className="flex items-center justify-between">
                <span className="label-sm">Total saved</span>
                <span className="text-xs text-fg-subtle">
                  {goals.length} goal{goals.length === 1 ? "" : "s"} &middot;{" "}
                  {totalsByCurrency.length} currenc
                  {totalsByCurrency.length === 1 ? "y" : "ies"}
                </span>
              </div>
              <ul className="flex flex-col gap-3">
                {totalsByCurrency.map((row) => (
                  <li key={row.currency} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <Amount
                          value={row.saved}
                          tone="neutral"
                          size="md"
                          currency={row.currency}
                        />
                        <span className="text-xs text-fg-subtle truncate">
                          of {row.target.toLocaleString("en-US")} {row.currency}
                        </span>
                      </div>
                      <span className="text-xs text-fg-subtle tabular-nums">
                        {Math.round(row.percent * 100)}%
                      </span>
                    </div>
                    <ProgressBar
                      value={row.percent}
                      tone="accent"
                      ariaLabel={`${row.currency} saved progress`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <GoalList
          goals={goals}
          contributionsByGoal={contributionsByGoal}
          monthlyRate={monthlyRate}
          onContribute={(goal) => setMode({ kind: "contribute", goal })}
          onEdit={(goal) => setMode({ kind: "edit", goal })}
          onDelete={(goal) => setPendingDelete(goal)}
          emptyTitle="No goals yet"
          emptyDescription="Name something you're saving for and Perch will track your monthly pace toward it."
          emptyActionLabel="Create a goal"
          emptyActionOnClick={() => setMode({ kind: "create" })}
        />
        </>
      )}

      <Modal open={mode.kind !== "closed"} onClose={close} title={modalTitle}>
        {mode.kind === "contribute" ? (
          <ContributionForm
            goalId={mode.goal.id}
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
