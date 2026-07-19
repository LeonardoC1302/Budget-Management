"use client";

import { useMemo } from "react";
import Link from "next/link";
import Button from "@/components/atoms/Button";
import BudgetRow from "@/components/molecules/BudgetRow";
import GoalCard from "@/components/molecules/GoalCard";
import SignOutButton from "@/components/molecules/SignOutButton";
import DashboardSummary from "@/components/organisms/DashboardSummary";
import InsightsSection from "@/components/organisms/InsightsSection";
import TransactionList from "@/components/organisms/TransactionList";
import { useAccounts } from "@/hooks/useAccounts";
import { useBudgets } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { useGoals } from "@/hooks/useGoals";
import { useTransactions } from "@/hooks/useTransactions";
import { getMonthlyTotals, monthKeyOffset } from "@/lib/utils/analytics";

export default function HomePage() {
  const { transactions, remove, loading } = useTransactions();
  const { byId: accountsById } = useAccounts();
  const { byId: categoriesById } = useCategories();
  const { goals, contributionsByGoal, monthlyRate } = useGoals();
  const { budgets, progressByCategory } = useBudgets();

  const monthTotals = useMemo(
    () => getMonthlyTotals(transactions, monthKeyOffset(0)),
    [transactions],
  );

  const recent = transactions.filter((t) => t.type !== "investment").slice(0, 5);
  const previewGoals = goals.slice(0, 2);
  const previewBudgets = [...budgets]
    .sort(
      (a, b) =>
        (progressByCategory[b.categoryId]?.percent ?? 0) -
        (progressByCategory[a.categoryId]?.percent ?? 0),
    )
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="label-sm">Overview</span>
          <h1 className="heading-xl">This month</h1>
        </div>
        <SignOutButton />
      </header>

      <DashboardSummary
        income={monthTotals.income}
        expense={monthTotals.expense}
        balance={monthTotals.net}
      />

      <InsightsSection
        transactions={transactions}
        categoriesById={categoriesById}
      />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="heading-lg">Budgets</h2>
          <Link
            href="/budgets"
            className="text-sm text-fg-muted hover:text-fg"
          >
            View all →
          </Link>
        </div>

        {previewBudgets.length === 0 ? (
          <Link href="/budgets">
            <div className="surface p-6 text-center text-sm text-fg-muted hover:text-fg transition-colors cursor-pointer">
              No budgets yet. Set a monthly cap to start.
            </div>
          </Link>
        ) : (
          <ul className="flex flex-col gap-3">
            {previewBudgets.map((budget) => (
              <li key={budget.id}>
                <BudgetRow
                  budget={budget}
                  category={categoriesById[budget.categoryId]}
                  progress={
                    progressByCategory[budget.categoryId] ?? {
                      spent: 0,
                      remaining: budget.amount,
                      percent: 0,
                      status: "on-track",
                    }
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="heading-lg">Saving goals</h2>
          <Link href="/goals" className="text-sm text-fg-muted hover:text-fg">
            View all →
          </Link>
        </div>

        {previewGoals.length === 0 ? (
          <Link href="/goals">
            <div className="surface p-6 text-center text-sm text-fg-muted hover:text-fg transition-colors cursor-pointer">
              No goals yet. Create one to start planning.
            </div>
          </Link>
        ) : (
          <ul className="flex flex-col gap-3">
            {previewGoals.map((goal) => (
              <li key={goal.id}>
                <GoalCard
                  goal={goal}
                  contributions={contributionsByGoal[goal.id] ?? []}
                  monthlyRate={monthlyRate}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="heading-lg">Recent activity</h2>
          <Link
            href="/transactions"
            className="text-sm text-fg-muted hover:text-fg"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="surface p-8 text-center text-sm text-fg-muted">
            Loading…
          </div>
        ) : (
          <TransactionList
            transactions={recent}
            accountsById={accountsById}
            categoriesById={categoriesById}
            onDelete={remove}
            emptyMessage="No transactions yet. Add your first one to get started."
          />
        )}
      </section>

      <Link href="/add" className="sm:hidden">
        <Button size="lg" fullWidth>
          + Add transaction
        </Button>
      </Link>
    </div>
  );
}
