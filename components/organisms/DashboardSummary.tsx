"use client";

import SummaryCard from "@/components/molecules/SummaryCard";

interface DashboardSummaryProps {
  income: number;
  expense: number;
}

/**
 * Income + Expenses side-by-side. Balance now lives in the Masthead
 * so the dashboard has a single hero figure instead of three.
 */
export default function DashboardSummary({
  income,
  expense,
}: DashboardSummaryProps) {
  return (
    <section className="grid grid-cols-2 gap-3">
      <SummaryCard label="Income" amount={income} tone="income" />
      <SummaryCard label="Expenses" amount={expense} tone="expense" />
    </section>
  );
}
