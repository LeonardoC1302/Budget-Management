"use client";

import EmptyState from "@/components/atoms/EmptyState";
import GoalCard from "@/components/molecules/GoalCard";
import type { Goal, GoalContribution } from "@/lib/types";

import { t } from "@/lib/i18n";
interface GoalListProps {
  goals: Goal[];
  contributionsByGoal: Record<string, GoalContribution[]>;
  monthlyRate: number | null;
  onContribute?: (goal: Goal) => void;
  onWithdraw?: (goal: Goal) => void;
  onDeleteContribution?: (id: string) => void | Promise<void>;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionOnClick?: () => void;
  emptyActionHref?: string;
  emptyMessage?: string;
}

export default function GoalList({
  goals,
  contributionsByGoal,
  monthlyRate,
  onContribute,
  onWithdraw,
  onDeleteContribution,
  onEdit,
  onDelete,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionOnClick,
  emptyActionHref,
  emptyMessage = t("No goals yet."),
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
    <div className="rooms" role="list">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          contributions={contributionsByGoal[goal.id] ?? []}
          monthlyRate={monthlyRate}
          onContribute={onContribute}
          onWithdraw={onWithdraw}
          onDeleteContribution={onDeleteContribution}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
