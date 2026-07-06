"use client";

import Amount from "@/components/atoms/Amount";
import ProgressBar from "@/components/atoms/ProgressBar";
import { formatCurrency } from "@/lib/utils/format";
import type { BudgetTotals } from "@/lib/utils/budgets";

interface BudgetSummaryProps {
  totals: BudgetTotals;
  currency?: string;
}

export default function BudgetSummary({
  totals,
  currency = "USD",
}: BudgetSummaryProps) {
  const { totalCap, totalSpent, uncappedSpend } = totals;
  const percent = totalCap > 0 ? totalSpent / totalCap : 0;
  const over = totalSpent > totalCap && totalCap > 0;
  const remaining = totalCap - totalSpent;

  return (
    <section className="surface p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-sm">Total budgeted</p>
          <Amount
            value={totalSpent}
            size="xl"
            tone={over ? "expense" : "neutral"}
            currency={currency}
          />
          <p className="text-xs text-fg-subtle mt-0.5">
            of {formatCurrency(totalCap, currency)}
          </p>
        </div>
        <span
          className={
            over
              ? "text-sm font-medium text-expense"
              : "text-sm text-fg-muted"
          }
        >
          {over
            ? `${formatCurrency(-remaining, currency)} over`
            : `${formatCurrency(remaining, currency)} left`}
        </span>
      </div>

      <ProgressBar
        value={percent}
        tone={over ? "expense" : "accent"}
        ariaLabel="Overall budget progress"
      />

      {uncappedSpend > 0 && (
        <p className="text-xs text-fg-subtle">
          Plus{" "}
          <span className="text-fg font-medium">
            {formatCurrency(uncappedSpend, currency)}
          </span>{" "}
          spent in categories without a budget.
        </p>
      )}
    </section>
  );
}
