"use client";

import { useMemo, useState } from "react";
import Button from "@/components/atoms/Button";
import EmptyState from "@/components/atoms/EmptyState";
import Modal from "@/components/atoms/Modal";
import RowSkeleton from "@/components/atoms/RowSkeleton";
import SavingsLineChart from "@/components/atoms/SavingsLineChart";
import CategoryForm from "@/components/molecules/CategoryForm";
import CategoryManageModal from "@/components/molecules/CategoryManageModal";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import TransactionDetailsModal from "@/components/molecules/TransactionDetailsModal";
import TransactionForm from "@/components/molecules/TransactionForm";
import TransactionList from "@/components/organisms/TransactionList";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import {
  monthKeyOffset,
  monthLabel,
  type MonthlyPoint,
} from "@/lib/utils/analytics";
import { monthKeyOf } from "@/lib/utils/budgets";
import { formatCurrency } from "@/lib/utils/format";
import type { NewCategory, Transaction } from "@/lib/types";

export default function InvestmentsPage() {
  const { transactions, remove, update, loading } = useTransactions();
  const { byId: accountsById } = useAccounts();
  const { byId: categoriesById, filterByType, add: addCategory } =
    useCategories();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const investments = useMemo(
    () => transactions.filter((t) => t.type === "investment"),
    [transactions],
  );

  const investmentCategories = filterByType("investment");

  const { total, byCategory } = useMemo(() => {
    let total = 0;
    const byCategory: Record<string, number> = {};
    for (const t of investments) {
      total += t.amountUSD;
      byCategory[t.categoryId] = (byCategory[t.categoryId] ?? 0) + t.amountUSD;
    }
    return { total, byCategory };
  }, [investments]);

  const breakdown = useMemo(() => {
    const rows = investmentCategories.map((c) => ({
      id: c.id,
      name: c.name,
      amount: byCategory[c.id] ?? 0,
      share: total > 0 ? (byCategory[c.id] ?? 0) / total : 0,
    }));
    return rows.sort((a, b) => b.amount - a.amount);
  }, [investmentCategories, byCategory, total]);

  const contributionSeries = useMemo<MonthlyPoint[]>(() => {
    const points: MonthlyPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const key = monthKeyOffset(-i);
      let sum = 0;
      for (const t of investments) {
        if (monthKeyOf(t.date) === key) sum += t.amountUSD;
      }
      points.push({
        monthKey: key,
        label: monthLabel(key),
        income: sum,
        expense: 0,
        net: sum,
      });
    }
    return points;
  }, [investments]);

  const hasContributions = contributionSeries.some((p) => p.net > 0);

  async function handleCreateCategory(input: NewCategory) {
    await addCategory(input);
    setCreateCategoryOpen(false);
  }

  const hasCategories = investmentCategories.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead
        kicker="Portfolio"
        title="Investments"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setManageOpen(true)}
          >
            Manage
          </Button>
        }
      />

      <section
        className="surface p-5 flex flex-col gap-1.5"
        aria-label="Total invested"
      >
        <span className="label-sm">Total invested</span>
        <span className="text-3xl font-semibold tracking-tight tabular-nums text-invest">
          {formatCurrency(total, "USD")}
        </span>
        <span className="text-xs text-fg-subtle">
          Across {investments.length} transaction
          {investments.length === 1 ? "" : "s"}
        </span>
      </section>

      {hasContributions && (
        <section className="surface p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">
              Contribution rhythm
            </h2>
            <span className="text-xs text-fg-subtle">Last 6 months</span>
          </div>
          <SavingsLineChart data={contributionSeries} currency="USD" />
        </section>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="by-category">
        <div className="flex items-center justify-between">
          <h2 id="by-category" className="heading-lg">
            By category
          </h2>
        </div>

        {!hasCategories ? (
          <EmptyState
            title="No investment categories yet"
            description="Create at least one category (index funds, retirement, crypto…) so you can group and see the share of each."
            actionLabel="New investment category"
            actionOnClick={() => setCreateCategoryOpen(true)}
          />
        ) : (
          <ul className="surface divide-y divide-border">
            {breakdown.map((row) => (
              <li key={row.id} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-fg truncate">{row.name}</span>
                  <span className="text-sm tabular-nums text-fg">
                    {formatCurrency(row.amount, "USD")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full bg-invest"
                      style={{ width: `${Math.round(row.share * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-fg-subtle tabular-nums w-10 text-right">
                    {Math.round(row.share * 100)}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="activity">
        <div className="flex items-center justify-between">
          <h2 id="activity" className="heading-lg">
            Activity
          </h2>
        </div>

        {loading ? (
          <RowSkeleton count={4} />
        ) : (
          <TransactionList
            transactions={investments}
            accountsById={accountsById}
            categoriesById={categoriesById}
            onSelect={setSelected}
            groupByDate
            emptyTitle={
              hasCategories ? "No investments yet" : "Nothing logged yet"
            }
            emptyDescription={
              hasCategories
                ? "Log a contribution to a category from the Add tab to see it here."
                : "Create an investment category first, then log a contribution from the Add tab."
            }
            emptyActionLabel={hasCategories ? "Add a contribution" : undefined}
            emptyActionHref={hasCategories ? "/add" : undefined}
          />
        )}
      </section>

      <TransactionDetailsModal
        transaction={selected}
        account={selected ? accountsById[selected.accountId] : undefined}
        category={selected ? categoriesById[selected.categoryId] : undefined}
        linkedAccount={
          selected?.linkedAccountId
            ? accountsById[selected.linkedAccountId]
            : undefined
        }
        onClose={() => setSelected(null)}
        onEdit={(t) => {
          setSelected(null);
          setEditing(t);
        }}
        onDelete={remove}
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit investment"
      >
        {editing && (
          <TransactionForm
            initial={editing}
            onSubmit={async (input) => {
              await update(editing.id, input);
              setEditing(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={createCategoryOpen}
        onClose={() => setCreateCategoryOpen(false)}
        title="New investment category"
      >
        <CategoryForm
          type="investment"
          onSubmit={handleCreateCategory}
          onCancel={() => setCreateCategoryOpen(false)}
        />
      </Modal>

      <CategoryManageModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        type="investment"
      />
    </div>
  );
}
