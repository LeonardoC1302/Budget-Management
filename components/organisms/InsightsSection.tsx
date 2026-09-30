"use client";

import { useMemo } from "react";
import CategoryDonut from "@/components/atoms/CategoryDonut";
import DeltaPill from "@/components/atoms/DeltaPill";
import EmptyState from "@/components/atoms/EmptyState";
import SavingsLineChart from "@/components/atoms/SavingsLineChart";
import SavingsRateChart, { savingsRate } from "@/components/atoms/SavingsRateChart";
import NetWorthCard from "@/components/organisms/NetWorthCard";
import { usePreferences } from "@/contexts/PreferencesContext";
import {
  computeDelta,
  getCategoryBreakdown,
  getMonthlySeries,
  monthKeyOffset,
} from "@/lib/utils/analytics";
import type { Category, Transaction } from "@/lib/types";

import { t } from "@/lib/i18n";
interface InsightsSectionProps {
  transactions: Transaction[];
  categoriesById: Record<string, Category>;
}

export default function InsightsSection({
  transactions,
  categoriesById,
}: InsightsSectionProps) {
  const { displayCurrency, convertUsd } = usePreferences();
  const series = useMemo(
    () => getMonthlySeries(transactions, 6),
    [transactions],
  );
  const displaySeries = useMemo(
    () =>
      series.map((p) => ({
        ...p,
        income: convertUsd(p.income),
        expense: convertUsd(p.expense),
        net: convertUsd(p.net),
      })),
    [series, convertUsd],
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
  const displayBreakdown = useMemo(
    () => ({
      total: convertUsd(breakdown.total),
      slices: breakdown.slices.map((s) => ({
        ...s,
        amount: convertUsd(s.amount),
      })),
    }),
    [breakdown, convertUsd],
  );

  const hasData = transactions.length > 0;

  // Income-weighted: total kept over total earned across the window, so a
  // low-income month doesn't swing the average.
  const rateSummary = useMemo(() => {
    const income = series.reduce((s, p) => s + p.income, 0);
    const net = series.reduce((s, p) => s + p.net, 0);
    return {
      current: current ? savingsRate(current) : null,
      average: income > 0 ? net / income : null,
    };
  }, [series, current]);

  return (
    <section className="flex flex-col" aria-labelledby="insights-heading">
      <div className="section-head">
        <span className="section-head-title">{t("Insights")}</span>
        <span className="section-head-meta">{t("This month, in figures")}</span>
      </div>

      {!hasData ? (
        <EmptyState
          title={t("Trends need a few entries.")}
          description={t("Add a handful of transactions and this space will fill in with monthly changes and category breakdowns.")}
          actionLabel={t("Add a transaction")}
          actionHref="/add"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {deltas && (
            <div className="rooms-h grid-cols-3" aria-label={t("Change vs last month")}>
              <DeltaPill label={t("Income")} delta={deltas.income} goodWhen="up" />
              <DeltaPill
                label={t("Expenses")}
                delta={deltas.expense}
                goodWhen="down"
              />
              <DeltaPill
                label={t("Savings")}
                delta={deltas.net}
                goodWhen="up"
                reassuranceWhenBad={t("Some months ebb — a longer window before adjusting.")}
              />
            </div>
          )}

          <NetWorthCard />

          <div className="chart-card">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <div>
                <div className="chart-title">{t("Savings rate")}</div>
                <div className="chart-lede">{t("Share of income you kept.")}</div>
              </div>
              <div className="text-right">
                <div className="font-serif text-2xl tabular-nums leading-tight">
                  {rateSummary.current === null
                    ? "—"
                    : `${Math.round(rateSummary.current * 100)}%`}
                </div>
                <div className="text-[11px] text-fg-subtle">
                  {t("this month")}
                  {rateSummary.average !== null &&
                    t(" · {percent}% over {count} months", {
                      percent: Math.round(rateSummary.average * 100),
                      count: series.length,
                    })}
                </div>
              </div>
            </div>
            <SavingsRateChart data={series} />
          </div>

          <div className="chart-card">
            <div className="chart-title">{t("Six-month savings")}</div>
            <div className="chart-lede">{t("Net, month by month.")}</div>
            <SavingsLineChart data={displaySeries} currency={displayCurrency} />
          </div>

          <div className="chart-card">
            <div className="chart-title">{t("Spending by category")}</div>
            <div className="chart-lede">{t("Where the month went.")}</div>
            <CategoryDonut breakdown={displayBreakdown} currency={displayCurrency} />
          </div>
        </div>
      )}
    </section>
  );
}
