"use client";

import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import PhaseIndicator from "@/components/atoms/PhaseIndicator";
import ProgressBar from "@/components/atoms/ProgressBar";
import { DeleteIcon, EditIcon } from "@/lib/action/icons";
import { cn } from "@/lib/utils/cn";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
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
      <p className="text-sm text-income">Goal reached &mdash; nice work.</p>
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
      <p className="text-sm text-fg-muted">
        This month you&apos;re spending more than you earn, so the estimate
        pauses. It&apos;ll resume as soon as savings turn positive.
      </p>
    );
  }
  return (
    <p className="text-sm text-fg-muted leading-snug">
      If you keep saving{" "}
      <span className="text-fg font-medium">
        {formatCurrency(estimate.monthlyRate, BASE_CURRENCY)}
      </span>{" "}
      per month, you&apos;ll reach it in{" "}
      <span className="text-fg font-medium">
        {formatMonthsRough(estimate.months)}
      </span>{" "}
      &mdash; around{" "}
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
  const contributionCount = contributions.length;

  return (
    <article
      className={cn(
        "surface relative overflow-hidden p-5 flex flex-col gap-4",
        progress.reached && "goal-reached",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          progress.reached ? "bg-income" : "bg-accent/60",
        )}
      />

      <div className="flex items-start gap-4">
        <PhaseIndicator
          progress={progress.percent}
          reached={progress.reached}
          tone={progress.reached ? "income" : "accent"}
          size={48}
          ariaLabel={`${goal.name}: ${Math.round(progress.percent * 100)}%`}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-fg leading-tight truncate">
            {goal.name}
          </h3>
          {goal.targetDate && (
            <p className="text-xs text-fg-subtle mt-1">
              Target {formatTargetMonth(new Date(goal.targetDate))}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex flex-col gap-0.5">
            <span className="label-sm">Saved</span>
            <Amount
              value={progress.saved}
              size="lg"
              tone={progress.reached ? "income" : "neutral"}
              currency={goal.currency}
            />
          </div>
          <div className="text-right shrink-0 flex flex-col gap-0.5">
            <span className="label-sm">
              {progress.reached ? "Complete" : "To go"}
            </span>
            <p
              className={cn(
                "text-base font-semibold tabular-nums",
                progress.reached ? "text-income" : "text-fg",
              )}
            >
              {progress.reached
                ? "\u2713"
                : formatCurrency(progress.remaining, goal.currency)}
            </p>
          </div>
        </div>
        <ProgressBar
          value={progress.percent}
          tone={progress.reached ? "income" : "accent"}
          ariaLabel={`${goal.name} progress`}
        />
        <div className="flex items-center justify-between text-xs text-fg-subtle">
          <span>
            {formatCurrency(goal.targetAmount, goal.currency)} target
          </span>
          {contributionCount > 0 && (
            <span>
              {contributionCount} contribution
              {contributionCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <EstimateLine
        goal={goal}
        contributions={contributions}
        monthlyRate={monthlyRate}
      />

      {(onContribute || onEdit || onDelete) && (
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          {onContribute && !progress.reached && (
            <Button size="sm" onClick={() => onContribute(goal)}>
              + Contribute
            </Button>
          )}
          <div className="ml-auto flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Edit ${goal.name}`}
                onClick={() => onEdit(goal)}
                className="px-2"
              >
                <EditIcon aria-hidden />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Delete ${goal.name}`}
                onClick={() => onDelete(goal)}
                className="px-2"
              >
                <DeleteIcon aria-hidden />
              </Button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
