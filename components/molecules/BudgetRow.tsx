"use client";

import Button from "@/components/atoms/Button";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import type { Budget, Category } from "@/lib/types";
import type { BudgetProgress } from "@/lib/utils/budgets";
import { monthLabel } from "@/lib/utils/analytics";

interface BudgetRowProps {
  budget: Budget;
  category?: Category;
  progress: BudgetProgress;
  // False when looking at a past month: no pacing, past-tense notes.
  isCurrentMonth?: boolean;
  // This budget's last few months, oldest first, ending at the shown month.
  trend?: { monthKey: string; progress?: BudgetProgress }[];
  onEdit?: (budget: Budget) => void;
  onDelete?: (budget: Budget) => void;
}

function projectMonthEnd(spent: number): number | null {
  if (spent <= 0) return null;
  const now = new Date();
  const day = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  if (day <= 0 || day >= daysInMonth) return null;
  const monthProgress = day / daysInMonth;
  if (monthProgress <= 0) return null;
  return spent / monthProgress;
}

/**
 * Alcove budget row — a hairline-walled panel. Name and figure share the top
 * line; a thin rule below fills as the cap does; a soft note underneath tells
 * the story ("$32 left" / "Over cap by $12") without shouting.
 */
export default function BudgetRow({
  budget,
  category,
  progress,
  isCurrentMonth = true,
  trend,
  onEdit,
  onDelete,
}: BudgetRowProps) {
  const over = progress.status === "over";
  const cap = progress.cap;
  const currency = progress.currency;
  const categoryName = category?.name ?? "Unknown category";
  const pct = Math.max(0, Math.min(100, progress.percent * 100));
  const projected = isCurrentMonth ? projectMonthEnd(progress.spent) : null;

  const paceLine =
    !over && projected !== null
      ? projected <= cap
        ? `On pace: ${formatCurrency(cap - projected, currency)} under.`
        : `On pace: ${formatCurrency(projected - cap, currency)} over.`
      : null;

  const noteText = over
    ? `Over cap by ${formatCurrency(-progress.remaining, currency)}.`
    : isCurrentMonth
      ? `${formatCurrency(progress.remaining, currency)} left this month.`
      : `Finished ${formatCurrency(progress.remaining, currency)} under.`;

  return (
    <article className="px-4 py-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-serif text-base text-fg truncate">
          {categoryName}
        </span>
        <span className="figure text-xs text-fg whitespace-nowrap">
          <span className="text-fg">
            {formatCurrency(progress.spent, currency)}
          </span>
          <span className="text-fg-muted">
            {" / "}
            {formatCurrency(cap, currency)}
          </span>
        </span>
      </div>

      <div
        className="relative h-px bg-border overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${pct}%`,
            height: over ? 2 : 1,
            top: over ? -1 : 0,
            background: over
              ? "var(--color-expense)"
              : "var(--color-celadon-strong)",
          }}
        />
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span
          className={cn(
            "lede text-xs",
            over && "text-expense",
          )}
        >
          {noteText}
        </span>
        {paceLine && (
          <span
            suppressHydrationWarning
            className="lede text-[11px] sm:text-right"
          >
            {paceLine}
          </span>
        )}
      </div>

      {trend && trend.some((m) => m.progress && m.progress.spent > 0) && (
        <BudgetTrend trend={trend} />
      )}

      {(onEdit || onDelete) && (
        <div className="flex gap-2 pt-2 border-t border-border">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(budget)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(budget)}>
              Delete
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * Six tiny bars, one per month: height is spend as a share of that month's
 * cap (capped at 130% so a blowout doesn't flatten the rest), with a hairline
 * at 100%. Over-cap months use the expense tone and are named in the label,
 * so the state isn't carried by color alone.
 */
function BudgetTrend({
  trend,
}: {
  trend: { monthKey: string; progress?: BudgetProgress }[];
}) {
  const H = 28;
  const MAX = 1.3;
  const capY = H - (1 / MAX) * H;
  const overMonths = trend
    .filter((m) => m.progress?.status === "over")
    .map((m) => monthLabel(m.monthKey));
  const label = `Last ${trend.length} months: ${trend
    .map((m) =>
      m.progress
        ? `${monthLabel(m.monthKey)} ${Math.round(m.progress.percent * 100)}%`
        : `${monthLabel(m.monthKey)} no cap`,
    )
    .join(", ")}`;
  return (
    <div className="flex items-end gap-3">
      <svg
        viewBox={`0 0 ${trend.length * 10} ${H}`}
        className="h-7 w-24 shrink-0"
        role="img"
        aria-label={label}
      >
        {trend.map((m, i) => {
          const p = m.progress;
          if (!p) return null;
          const ratio = Math.min(Math.max(p.percent, 0), MAX) / MAX;
          const h = Math.max(ratio * H, p.spent > 0 ? 2 : 0);
          return (
            <rect
              key={m.monthKey}
              x={i * 10 + 1}
              y={H - h}
              width={8}
              height={h}
              rx={2}
              fill={
                p.status === "over"
                  ? "var(--color-expense)"
                  : "var(--color-celadon-strong)"
              }
              opacity={i === trend.length - 1 ? 1 : 0.55}
            >
              <title>{`${monthLabel(m.monthKey)}: ${Math.round(p.percent * 100)}% of cap`}</title>
            </rect>
          );
        })}
        <line
          x1={0}
          x2={trend.length * 10}
          y1={capY}
          y2={capY}
          stroke="var(--color-fg-subtle)"
          strokeWidth={0.75}
          strokeDasharray="2 2"
        />
      </svg>
      <span className="text-[11px] text-fg-subtle">
        {overMonths.length === 0
          ? "Under cap every month shown"
          : `Over in ${overMonths.join(", ")}`}
      </span>
    </div>
  );
}
