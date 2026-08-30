"use client";

import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import ProgressBar from "@/components/atoms/ProgressBar";
import { usePreferences } from "@/contexts/PreferencesContext";
import { DeleteIcon, EditIcon } from "@/lib/action/icons";
import { cn } from "@/lib/utils/cn";
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
  const { displayCurrency, convertUsd } = usePreferences();
  const estimate = estimateTimeToGoal(goal, contributions, monthlyRate);

  if (estimate.kind === "reached") {
    return (
      <p className="lede text-income">Goal reached — nice work.</p>
    );
  }
  if (estimate.kind === "no-data") {
    return (
      <p className="lede">
        Add a few weeks of transactions and we&apos;ll estimate how long this
        goal will take.
      </p>
    );
  }
  if (estimate.kind === "negative") {
    return (
      <p className="lede">
        This month you&apos;re spending more than you earn, so the estimate
        pauses. It&apos;ll resume as soon as savings turn positive.
      </p>
    );
  }
  return (
    <p className="lede leading-snug">
      At{" "}
      <span className="text-fg font-medium not-italic figure">
        {formatCurrency(convertUsd(estimate.monthlyRate), displayCurrency)}
      </span>
      {" "}per month, you&apos;ll reach it in{" "}
      <span className="text-fg font-medium not-italic">
        {formatMonthsRough(estimate.months)}
      </span>
      {" — around "}
      <span className="text-fg font-medium not-italic">
        {formatTargetMonth(estimate.targetDate)}
      </span>
      .
    </p>
  );
}

/**
 * Alcove goal card — a hairline room. Name + target sit on top, saved/remaining
 * mono figures beside, a thin progress rule, then the estimate as a soft note.
 */
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
        "p-5 flex flex-col gap-4",
        progress.reached && "goal-reached",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg text-fg leading-tight truncate">
            {goal.name}
          </h3>
          {goal.targetDate && (
            <p className="text-[11px] text-fg-muted mt-1 uppercase tracking-[0.14em]">
              Target · {formatTargetMonth(new Date(goal.targetDate))}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="kicker mb-1">
            {progress.reached ? "Complete" : "To go"}
          </div>
          <div
            className={cn(
              "font-serif text-xl tabular-nums leading-none",
              progress.reached ? "text-income" : "text-fg",
            )}
          >
            {progress.reached
              ? "✓"
              : formatCurrency(progress.remaining, goal.currency)}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex flex-col gap-1">
            <span className="kicker">Saved</span>
            <Amount
              value={progress.saved}
              size="lg"
              tone={progress.reached ? "income" : "neutral"}
              currency={goal.currency}
            />
          </div>
          <span className="figure text-xs text-fg-muted whitespace-nowrap">
            of {formatCurrency(goal.targetAmount, goal.currency)}
          </span>
        </div>
        <ProgressBar
          value={progress.percent}
          tone={progress.reached ? "income" : "accent"}
          ariaLabel={`${goal.name} progress`}
        />
        <div className="flex items-center justify-between text-[11px] text-fg-muted uppercase tracking-[0.14em]">
          <span>{Math.round(progress.percent * 100)}% laid by</span>
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
