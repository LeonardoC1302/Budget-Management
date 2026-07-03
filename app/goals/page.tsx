"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import Modal from "@/components/atoms/Modal";
import ContributionForm from "@/components/molecules/ContributionForm";
import GoalForm from "@/components/molecules/GoalForm";
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

  async function handleDelete(goal: Goal) {
    const confirmed =
      typeof window !== "undefined" &&
      window.confirm(`Delete "${goal.name}"? Its contributions will also be removed.`);
    if (!confirmed) return;
    await removeGoal(goal.id);
  }

  const modalTitle =
    mode.kind === "create"
      ? "New goal"
      : mode.kind === "edit"
        ? "Edit goal"
        : mode.kind === "contribute"
          ? `Contribute to ${mode.goal.name}`
          : "";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="label-sm">Plan</span>
          <h1 className="heading-xl">Saving goals</h1>
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
        <GoalList
          goals={goals}
          contributionsByGoal={contributionsByGoal}
          monthlyRate={monthlyRate}
          onContribute={(goal) => setMode({ kind: "contribute", goal })}
          onEdit={(goal) => setMode({ kind: "edit", goal })}
          onDelete={handleDelete}
          emptyMessage="No goals yet. Add one to start planning."
        />
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
    </div>
  );
}
