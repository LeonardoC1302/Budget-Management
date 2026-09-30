"use client";

import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import ProgressBar from "@/components/atoms/ProgressBar";
import { useState } from "react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { DeleteIcon, EditIcon } from "@/lib/action/icons";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  computeGoalProgress,
  estimateTimeToGoal,
  formatMonthsRough,
  formatTargetMonth,
} from "@/lib/utils/goals";
import type { Goal, GoalContribution } from "@/lib/types";

import { t, tn } from "@/lib/i18n";
interface GoalCardProps {
  goal: Goal;
  contributions: GoalContribution[];
  monthlyRate: number | null;
  onContribute?: (goal: Goal) => void;
  onWithdraw?: (goal: Goal) => void;
  onDeleteContribution?: (id: string) => void | Promise<void>;
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
      <p className="lede text-income">{t("Goal reached — nice work.")}</p>
    );
  }
  if (estimate.kind === "no-data") {
    return (
      <p className="lede">
        {t("Add a few weeks of transactions and we'll estimate how long this goal will take.")}
      </p>
    );
  }
  if (estimate.kind === "negative") {
    return (
      <p className="lede">
        {t("This month you're spending more than you earn, so the estimate pauses. It'll resume as soon as savings turn positive.")}
      </p>
    );
  }
  return (
    <p className="lede leading-snug">
      {t("At")}{" "}
      <span className="text-fg font-medium not-italic figure">
        {formatCurrency(convertUsd(estimate.monthlyRate), displayCurrency)}
      </span>
{" "}{t("per month, you'll reach it in")}{" "}
      <span className="text-fg font-medium not-italic">
        {formatMonthsRough(estimate.months)}
      </span>
      {t(" — around ")}
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
  onWithdraw,
  onDeleteContribution,
  onEdit,
  onDelete,
}: GoalCardProps) {
  const progress = computeGoalProgress(goal, contributions);
  const contributionCount = contributions.filter((c) => !c.withdrawal).length;
  const [showHistory, setShowHistory] = useState(false);
  const history = [...contributions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );

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
              {t("Target · {month}", { month: formatTargetMonth(new Date(goal.targetDate)) })}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="kicker mb-1">
            {progress.reached ? t("Complete") : t("To go")}
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
            <span className="kicker">{t("Saved")}</span>
            <Amount
              value={progress.saved}
              size="lg"
              tone={progress.reached ? "income" : "neutral"}
              currency={goal.currency}
            />
          </div>
          <span className="figure text-xs text-fg-muted whitespace-nowrap">
            {t("of {amount}", { amount: formatCurrency(goal.targetAmount, goal.currency) })}
          </span>
        </div>
        <ProgressBar
          value={progress.percent}
          tone={progress.reached ? "income" : "accent"}
          ariaLabel={t("{name} progress", { name: goal.name })}
        />
        <div className="flex items-center justify-between text-[11px] text-fg-muted uppercase tracking-[0.14em]">
          <span>{t("{percent}% laid by", { percent: Math.round(progress.percent * 100) })}</span>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              aria-expanded={showHistory}
              className="uppercase tracking-[0.14em] hover:text-fg"
            >
              {tn("{count} contribution", "{count} contributions", contributionCount)}
              {history.length > contributionCount
                ? t(" · {0} withdrawn", { "0": history.length - contributionCount })
                : ""}{" "}
              {showHistory ? "▴" : "▾"}
            </button>
          )}
        </div>
      </div>

      {showHistory && (
        <ul className="flex flex-col divide-y divide-border text-sm">
          {history.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-fg truncate">
                  {c.note || (c.withdrawal ? t("Withdrawal") : t("Contribution"))}
                </p>
                <p className="text-xs text-fg-subtle">{formatDate(c.date)}</p>
              </div>
              <span
                className={cn(
                  "tabular-nums",
                  c.amount < 0 ? "text-expense" : "text-fg",
                )}
              >
                {c.amount < 0 ? "−" : "+"}
                {formatCurrency(Math.abs(c.amount), goal.currency)}
              </span>
              {onDeleteContribution && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("Delete entry")}
                  onClick={() => onDeleteContribution(c.id)}
                  className="px-2"
                >
                  <DeleteIcon aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <EstimateLine
        goal={goal}
        contributions={contributions}
        monthlyRate={monthlyRate}
      />

      {(onContribute || onWithdraw || onEdit || onDelete) && (
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          {onContribute && !progress.reached && (
            <Button size="sm" onClick={() => onContribute(goal)}>
              {t("+ Contribute")}
            </Button>
          )}
          {onWithdraw && progress.saved > 0 && (
            <Button variant="secondary" size="sm" onClick={() => onWithdraw(goal)}>
              {t("Withdraw")}
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
