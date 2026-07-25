"use client";

import EmptyState from "@/components/atoms/EmptyState";
import GoalCard from "@/components/molecules/GoalCard";
import type { Goal, GoalContribution } from "@/lib/types";

interface GoalListProps {
  goals: Goal[];
  contributionsByGoal: Record<string, GoalContribution[]>;
  monthlyRate: number | null;
  onContribute?: (goal: Goal) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionOnClick?: () => void;
  emptyActionHref?: string;
  /** @deprecated Use `emptyTitle` instead. Kept for backwards compat. */
  emptyMessage?: string;
}

export default function GoalList({
  goals,
  contributionsByGoal,
  monthlyRate,
  onContribute,
  onEdit,
  onDelete,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionOnClick,
  emptyActionHref,
  emptyMessage = "No goals yet.",
}: GoalListProps) {
  if (goals.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? emptyMessage}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        actionOnClick={emptyActionOnClick}
        actionHref={emptyActionHref}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {goals.map((goal) => (
        <li key={goal.id}>
          <GoalCard
            goal={goal}
            contributions={contributionsByGoal[goal.id] ?? []}
            monthlyRate={monthlyRate}
            onContribute={onContribute}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
