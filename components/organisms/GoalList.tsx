"use client";

import GoalCard from "@/components/molecules/GoalCard";
import type { Goal, GoalContribution } from "@/lib/types";

interface GoalListProps {
  goals: Goal[];
  contributionsByGoal: Record<string, GoalContribution[]>;
  monthlyRate: number | null;
  onContribute?: (goal: Goal) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  emptyMessage?: string;
}

export default function GoalList({
  goals,
  contributionsByGoal,
  monthlyRate,
  onContribute,
  onEdit,
  onDelete,
  emptyMessage = "No goals yet.",
}: GoalListProps) {
  if (goals.length === 0) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-fg-muted text-sm">{emptyMessage}</p>
      </div>
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
