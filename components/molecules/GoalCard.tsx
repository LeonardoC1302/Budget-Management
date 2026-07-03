"use client";

import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import ProgressBar from "@/components/atoms/ProgressBar";
import { formatCurrency } from "@/lib/utils/format";
import {
  computeGoalProgress,
  estimateTimeToGoal,
  formatMonthsRough,
  formatTargetMonth,
} from "@/lib/utils/goals";
import type { Goal, GoalContribution } from "@/lib/types";

interface GoalCardProps {
  goal: Goal;
  contributions: GoalContribution[];
  monthlyRate: number | null;
  onContribute?: (goal: Goal) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
}

function EstimateLine({
  goal,
  contributions,
  monthlyRate,
}: {
  goal: Goal;
  contributions: GoalContribution[];
  monthlyRate: number | null;
}) {
  const estimate = estimateTimeToGoal(goal, contributions, monthlyRate);

  if (estimate.kind === "reached") {
    return (
      <p className="text-sm text-income">
        Goal reached — nice work.
      </p>
    );
  }
  if (estimate.kind === "no-data") {
    return (
      <p className="text-sm text-fg-muted">
        Add a few weeks of transactions and we&apos;ll estimate how long this
        goal will take.
      </p>
    );
  }
  if (estimate.kind === "negative") {
    return (
      <p className="text-sm text-expense">
        You&apos;re spending more than you earn right now, so this goal
        isn&apos;t on track.
      </p>
    );
  }
  return (
    <p className="text-sm text-fg-muted">
      If you keep saving{" "}
      <span className="text-fg font-medium">
        {formatCurrency(estimate.monthlyRate, goal.currency)}
      </span>{" "}
      per month, you&apos;ll reach it in{" "}
      <span className="text-fg font-medium">
        {formatMonthsRough(estimate.months)}
      </span>{" "}
      — around{" "}
      <span className="text-fg font-medium">
        {formatTargetMonth(estimate.targetDate)}
      </span>
      .
    </p>
  );
}

export default function GoalCard({
  goal,
  contributions,
  monthlyRate,
  onContribute,
  onEdit,
  onDelete,
}: GoalCardProps) {
  const progress = computeGoalProgress(goal, contributions);

  return (
    <article className="surface p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-fg truncate">
            {goal.name}
          </h3>
          {goal.targetDate && (
            <p className="text-xs text-fg-subtle mt-0.5">
              Target: {formatTargetMonth(new Date(goal.targetDate))}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <Amount
            value={progress.saved}
            size="lg"
            tone={progress.reached ? "income" : "neutral"}
            currency={goal.currency}
          />
          <p className="text-xs text-fg-subtle mt-0.5">
            of {formatCurrency(goal.targetAmount, goal.currency)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <ProgressBar
          value={progress.percent}
          tone={progress.reached ? "income" : "accent"}
          ariaLabel={`${goal.name} progress`}
        />
        <div className="flex items-center justify-between text-xs text-fg-subtle">
          <span>{Math.round(progress.percent * 100)}%</span>
          <span>
            {progress.reached
              ? "Complete"
              : `${formatCurrency(progress.remaining, goal.currency)} to go`}
          </span>
        </div>
      </div>

      <EstimateLine
        goal={goal}
        contributions={contributions}
        monthlyRate={monthlyRate}
      />

      {(onContribute || onEdit || onDelete) && (
        <div className="flex gap-2 flex-wrap">
          {onContribute && !progress.reached && (
            <Button size="sm" onClick={() => onContribute(goal)}>
              + Contribute
            </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(goal)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(goal)}>
              Delete
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
