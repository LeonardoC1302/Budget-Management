"use client";

import { useMemo } from "react";
import CategoryDonut from "@/components/atoms/CategoryDonut";
import DeltaPill from "@/components/atoms/DeltaPill";
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
      getCategoryBreakdown(
        transactions,
        categoriesById,
        monthKeyOffset(0),
      ),
    [transactions, categoriesById],
  );

  const hasData = transactions.length > 0;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="heading-lg">Insights</h2>

      {!hasData ? (
        <div className="surface p-6 text-center text-sm text-fg-muted">
          Add a few transactions to see monthly trends and breakdowns here.
        </div>
      ) : (
        <>
          {deltas && (
            <div className="grid grid-cols-3 gap-2">
              <DeltaPill label="Income" delta={deltas.income} goodWhen="up" />
              <DeltaPill
                label="Expenses"
                delta={deltas.expense}
                goodWhen="down"
              />
              <DeltaPill label="Savings" delta={deltas.net} goodWhen="up" />
            </div>
          )}

          <div className="surface p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg">
                Monthly savings
              </h3>
              <span className="text-xs text-fg-subtle">Last 6 months</span>
            </div>
            <SavingsLineChart data={series} currency={currency} />
          </div>

          <div className="surface p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg">
                Spending by category
              </h3>
              <span className="text-xs text-fg-subtle">This month</span>
            </div>
            <CategoryDonut breakdown={breakdown} currency={currency} />
          </div>
        </>
      )}
    </section>
  );
}
