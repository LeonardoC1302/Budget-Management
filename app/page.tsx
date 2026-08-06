"use client";

import { useMemo } from "react";
import Link from "next/link";
import Button from "@/components/atoms/Button";
import EmptyState from "@/components/atoms/EmptyState";
import RowSkeleton from "@/components/atoms/RowSkeleton";
import BudgetRow from "@/components/molecules/BudgetRow";
import GoalCard from "@/components/molecules/GoalCard";
import Masthead from "@/components/molecules/Masthead";
import CreditCardNudge from "@/components/organisms/CreditCardNudge";
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
  const { transactions, loading } = useTransactions();
  const { byId: accountsById } = useAccounts();
  const { byId: categoriesById } = useCategories();
  const { goals, contributionsByGoal, monthlyRate } = useGoals();
  const { budgets, progressByCategory } = useBudgets();

  const monthTotals = useMemo(
    () => getMonthlyTotals(transactions, monthKeyOffset(0)),
    [transactions],
  );

  const recent = transactions
    .filter((t) => t.type !== "investment")
    .slice(0, 4);
  const previewGoals = goals.slice(0, 2);
  const previewBudgets = [...budgets]
    .sort(
      (a, b) =>
        (progressByCategory[b.categoryId]?.percent ?? 0) -
        (progressByCategory[a.categoryId]?.percent ?? 0),
    )
    .slice(0, 3);

  const hasTransactions = transactions.length > 0;

  return (
    <div className="flex flex-col gap-7">
      <Masthead balance={monthTotals.net} />

      <CreditCardNudge />

      <DashboardSummary
        income={monthTotals.income}
        expense={monthTotals.expense}
      />

      <section className="flex flex-col gap-3" aria-labelledby="recent-heading">
        <div className="flex items-center justify-between">
          <h2 id="recent-heading" className="heading-lg">
            Recent activity
          </h2>
          {hasTransactions && (
            <Link
              href="/transactions"
              className="text-sm text-fg-muted hover:text-fg"
            >
              View all &rarr;
            </Link>
          )}
        </div>

        {loading ? (
          <RowSkeleton count={3} />
        ) : !hasTransactions ? (
          <EmptyState
            title="No transactions yet"
            description="Add your first entry — income, expense, or transfer — to start seeing the shape of the month."
            actionLabel="Add a transaction"
            actionHref="/add"
          />
        ) : (
          <TransactionList
            transactions={recent}
            accountsById={accountsById}
            categoriesById={categoriesById}
          />
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="budgets-heading">
        <div className="flex items-center justify-between">
          <h2 id="budgets-heading" className="heading-lg">
            Budgets
          </h2>
          <Link
            href="/budgets"
            className="text-sm text-fg-muted hover:text-fg"
          >
            View all &rarr;
          </Link>
        </div>

        {previewBudgets.length === 0 ? (
          <EmptyState
            title="No budgets yet"
            description="Set a monthly cap on a category so you can catch trends before the end of the month."
            actionLabel="Add a budget"
            actionHref="/budgets"
          />
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

      <section className="flex flex-col gap-3" aria-labelledby="goals-heading">
        <div className="flex items-center justify-between">
          <h2 id="goals-heading" className="heading-lg">
            Saving goals
          </h2>
          <Link href="/goals" className="text-sm text-fg-muted hover:text-fg">
            View all &rarr;
          </Link>
        </div>

        {previewGoals.length === 0 ? (
          <EmptyState
            title="No goals yet"
            description="Name something you're saving for and Perch will track your monthly pace toward it."
            actionLabel="Create a goal"
            actionHref="/goals"
          />
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

      <InsightsSection
        transactions={transactions}
        categoriesById={categoriesById}
      />

      <Link href="/add" className="sm:hidden">
        <Button size="lg" fullWidth>
          + Add transaction
        </Button>
      </Link>
    </div>
  );
}
