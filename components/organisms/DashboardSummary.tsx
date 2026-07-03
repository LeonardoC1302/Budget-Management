"use client";

import SummaryCard from "@/components/molecules/SummaryCard";

interface DashboardSummaryProps {
  income: number;
  expense: number;
  balance: number;
}

export default function DashboardSummary({
  income,
  expense,
  balance,
}: DashboardSummaryProps) {
  return (
    <section className="grid grid-cols-2 gap-3">
      <SummaryCard
        label="Balance"
        amount={balance}
        tone={balance >= 0 ? "income" : "expense"}
        emphasized
      />
      <SummaryCard label="Income" amount={income} tone="income" />
      <SummaryCard label="Expenses" amount={expense} tone="expense" />
    </section>
  );
}
