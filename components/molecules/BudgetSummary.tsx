"use client";

import Amount from "@/components/atoms/Amount";
import ProgressBar from "@/components/atoms/ProgressBar";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import type { BudgetTotals } from "@/lib/utils/budgets";

import { t } from "@/lib/i18n";
interface BudgetSummaryProps {
  totals: BudgetTotals;
  currency?: string;
  label?: string;
}

export default function BudgetSummary({
  totals,
  currency = "USD",
  label = t("Spent this month"),
}: BudgetSummaryProps) {
  const { totalCap, totalSpent, uncappedSpend } = totals;
  const percent = totalCap > 0 ? totalSpent / totalCap : 0;
  const over = totalSpent > totalCap && totalCap > 0;
  const remaining = totalCap - totalSpent;

  return (
    <section className="masthead-balance surface p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex flex-col gap-1">
          <span className="label-sm">{label}</span>
          <Amount
            value={totalSpent}
            size="xl"
            tone={over ? "expense" : "neutral"}
            currency={currency}
          />
          <p className="text-xs text-fg-subtle tabular-nums">
            {t("of {amount} capped", { amount: formatCurrency(totalCap, currency) })}
          </p>
        </div>
        <div className="sm:text-right flex flex-col gap-1 min-w-0">
          <span className="label-sm">{over ? t("Over") : t("Left")}</span>
          <p
            className={cn(
              "text-lg font-semibold tabular-nums leading-tight",
              over ? "text-expense" : "text-fg",
            )}
          >
            {over
              ? formatCurrency(-remaining, currency)
              : formatCurrency(remaining, currency)}
          </p>
          <p className="text-[11px] text-fg-subtle uppercase tracking-wide">
            {t("{percent}% used", { percent: Math.round(percent * 100) })}
          </p>
        </div>
      </div>

      <ProgressBar
        value={percent}
        tone={over ? "expense" : "accent"}
        ariaLabel={t("Overall budget progress")}
      />

      {uncappedSpend > 0 && (
        <p className="text-xs text-fg-subtle">
          {t("Plus")}{" "}
          <span className="text-fg font-medium">
            {formatCurrency(uncappedSpend, currency)}
          </span>{" "}
          {t("spent in categories without a budget.")}
        </p>
      )}
    </section>
  );
}
