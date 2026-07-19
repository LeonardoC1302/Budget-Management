"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Button from "@/components/atoms/Button";
import Modal from "@/components/atoms/Modal";
import CategoryForm from "@/components/molecules/CategoryForm";
import CategoryManageModal from "@/components/molecules/CategoryManageModal";
import TransactionDetailsModal from "@/components/molecules/TransactionDetailsModal";
import TransactionForm from "@/components/molecules/TransactionForm";
import TransactionList from "@/components/organisms/TransactionList";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/utils/format";
import type { NewCategory, Transaction } from "@/lib/types";

export default function InvestmentsPage() {
  const { transactions, remove, update, loading } = useTransactions();
  const { byId: accountsById } = useAccounts();
  const { byId: categoriesById, filterByType, add: addCategory } = useCategories();
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

  async function handleCreateCategory(input: NewCategory) {
    await addCategory(input);
    setCreateCategoryOpen(false);
  }

  const hasCategories = investmentCategories.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="label-sm">Portfolio</span>
          <h1 className="heading-xl">Investments</h1>
        </div>
        {hasCategories && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setManageOpen(true)}
          >
            Manage
          </Button>
        )}
      </header>

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

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="heading-lg">By category</h2>
        </div>

        {!hasCategories ? (
          <div className="surface p-6 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-fg-muted">
              No investment categories yet. Create at least one to start
              logging investments.
            </p>
            <Button
              size="sm"
              onClick={() => setCreateCategoryOpen(true)}
            >
              + New category
            </Button>
          </div>
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

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="heading-lg">Activity</h2>
          {hasCategories && (
            <Link
              href="/add"
              className="text-sm text-fg-muted hover:text-fg"
            >
              + Add
            </Link>
          )}
        </div>

        {loading ? (
          <div className="surface p-8 text-center text-sm text-fg-muted">
            Loading…
          </div>
        ) : (
          <TransactionList
            transactions={investments}
            accountsById={accountsById}
            categoriesById={categoriesById}
            onDelete={remove}
            onSelect={setSelected}
            groupByDate
            emptyMessage={
              hasCategories
                ? "No investments yet. Add one from the Add tab."
                : "No investments yet."
            }
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
