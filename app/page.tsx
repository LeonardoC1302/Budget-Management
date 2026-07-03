"use client";

import Link from "next/link";
import Button from "@/components/atoms/Button";
import GoalCard from "@/components/molecules/GoalCard";
import DashboardSummary from "@/components/organisms/DashboardSummary";
import TransactionList from "@/components/organisms/TransactionList";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useGoals } from "@/hooks/useGoals";
import { useTransactions } from "@/hooks/useTransactions";

export default function HomePage() {
  const { transactions, totals, remove, loading } = useTransactions();
  const { byId: accountsById } = useAccounts();
  const { byId: categoriesById } = useCategories();
  const { goals, contributionsByGoal, monthlyRate } = useGoals();
  const recent = transactions.slice(0, 5);
  const previewGoals = goals.slice(0, 2);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="label-sm">Overview</span>
        <h1 className="heading-xl">This month</h1>
      </header>

      <DashboardSummary
        income={totals.income}
        expense={totals.expense}
        balance={totals.balance}
      />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="heading-lg">Saving goals</h2>
          <Link
            href="/goals"
            className="text-sm text-fg-muted hover:text-fg"
          >
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
