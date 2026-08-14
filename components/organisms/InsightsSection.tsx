"use client";

import { useMemo } from "react";
import CategoryDonut from "@/components/atoms/CategoryDonut";
import DeltaPill from "@/components/atoms/DeltaPill";
import EmptyState from "@/components/atoms/EmptyState";
import SavingsLineChart from "@/components/atoms/SavingsLineChart";
import {
  computeDelta,
  getCategoryBreakdown,
  getMonthlySeries,
  monthKeyOffset,
} from "@/lib/utils/analytics";
import type { Category, Transaction } from "@/lib/types";

interface InsightsSectionProps {
  transactions: Transaction[];
  categoriesById: Record<string, Category>;
  currency?: string;
}

export default function InsightsSection({
  transactions,
  categoriesById,
  currency = "USD",
}: InsightsSectionProps) {
  const series = useMemo(
    () => getMonthlySeries(transactions, 6),
    [transactions],
  );
  const current = series[series.length - 1];
  const previous = series[series.length - 2];

  const deltas = useMemo(() => {
    if (!current || !previous) return null;
    return {
      income: computeDelta(current.income, previous.income),
      expense: computeDelta(current.expense, previous.expense),
      net: computeDelta(current.net, previous.net),
    };
  }, [current, previous]);

  const breakdown = useMemo(
    () =>
      getCategoryBreakdown(transactions, categoriesById, monthKeyOffset(0)),
    [transactions, categoriesById],
  );

  const hasData = transactions.length > 0;

  return (
    <section className="flex flex-col" aria-labelledby="insights-heading">
      <div className="section-head">
        <span className="section-head-title">Insights</span>
        <span className="section-head-meta">This month, in figures</span>
      </div>

      {!hasData ? (
        <EmptyState
          title="Trends need a few entries."
          description="Add a handful of transactions and this space will fill in with monthly changes and category breakdowns."
          actionLabel="Add a transaction"
          actionHref="/add"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {deltas && (
            <div className="rooms-h grid-cols-3" aria-label="Change vs last month">
              <DeltaPill label="Income" delta={deltas.income} goodWhen="up" />
              <DeltaPill
                label="Expenses"
                delta={deltas.expense}
                goodWhen="down"
              />
              <DeltaPill
                label="Savings"
                delta={deltas.net}
                goodWhen="up"
                reassuranceWhenBad="Some months ebb — a longer window before adjusting."
              />
            </div>
          )}

          <div className="chart-card">
            <div className="chart-title">Six-month savings</div>
            <div className="chart-lede">Net, month by month.</div>
            <SavingsLineChart data={series} currency={currency} />
          </div>

          <div className="chart-card">
            <div className="chart-title">Spending by category</div>
            <div className="chart-lede">Where the month went.</div>
            <CategoryDonut breakdown={breakdown} currency={currency} />
          </div>
        </div>
      )}
    </section>
  );
}
