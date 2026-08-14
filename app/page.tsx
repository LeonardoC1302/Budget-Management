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
    .filter((t) => t.type !== "investment" && t.type !== "transfer")
    .slice(0, 5);
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
    <div className="flex flex-col gap-8">
      <Masthead balance={monthTotals.net} />

      <CreditCardNudge />

      <DashboardSummary
        income={monthTotals.income}
        expense={monthTotals.expense}
      />

      <section className="flex flex-col" aria-labelledby="recent-heading">
        <div className="section-head">
          <span id="recent-heading" className="section-head-title">
            Recent activity
          </span>
          {hasTransactions ? (
            <Link href="/transactions" className="section-head-link">
              See the ledger →
            </Link>
          ) : (
            <span className="section-head-meta">Once you begin logging</span>
          )}
        </div>

        {loading ? (
          <RowSkeleton count={3} />
        ) : !hasTransactions ? (
          <EmptyState
            title="No transactions yet."
            description="Add your first entry — income or expense — to start seeing the shape of the month."
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

      <section className="flex flex-col" aria-labelledby="budgets-heading">
        <div className="section-head">
          <span id="budgets-heading" className="section-head-title">
            Under caps
          </span>
          <Link href="/budgets" className="section-head-link">
            All budgets →
          </Link>
        </div>

        {previewBudgets.length === 0 ? (
          <EmptyState
            title="No caps set."
            description="Set a monthly cap on a category so you can catch trends before the end of the month."
            actionLabel="Add a budget"
            actionHref="/budgets"
          />
        ) : (
          <div className="rooms" role="list">
            {previewBudgets.map((budget) => (
              <BudgetRow
                key={budget.id}
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
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col" aria-labelledby="goals-heading">
        <div className="section-head">
          <span id="goals-heading" className="section-head-title">
            Saving toward
          </span>
          <Link href="/goals" className="section-head-link">
            All goals →
          </Link>
        </div>

        {previewGoals.length === 0 ? (
          <EmptyState
            title="Nothing being saved for."
            description="Name something you're saving for and we'll track your pace toward it."
            actionLabel="Create a goal"
            actionHref="/goals"
          />
        ) : (
          <div className="rooms" role="list">
            {previewGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                contributions={contributionsByGoal[goal.id] ?? []}
                monthlyRate={monthlyRate}
              />
            ))}
          </div>
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
