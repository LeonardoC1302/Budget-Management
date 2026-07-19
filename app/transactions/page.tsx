"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/atoms/Modal";
import TransactionDetailsModal from "@/components/molecules/TransactionDetailsModal";
import TransactionForm from "@/components/molecules/TransactionForm";
import TransactionList from "@/components/organisms/TransactionList";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils/cn";
import type { Transaction } from "@/lib/types";

const ALL_FILTER = "__all__";

export default function TransactionsPage() {
  const { transactions, remove, update, loading } = useTransactions();
  const { byId: accountsById } = useAccounts();
  const { byId: categoriesById } = useCategories();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_FILTER);

  const nonInvestment = useMemo(
    () => transactions.filter((t) => t.type !== "investment"),
    [transactions],
  );

  const usedCategories = useMemo(() => {
    const ids = new Set<string>();
    for (const t of nonInvestment) {
      if (t.categoryId) ids.add(t.categoryId);
    }
    return Array.from(ids)
      .map((id) => ({
        id,
        name: categoriesById[id]?.name ?? "Unknown",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [nonInvestment, categoriesById]);

  const filtered = useMemo(() => {
    if (categoryFilter === ALL_FILTER) return nonInvestment;
    return nonInvestment.filter((t) => t.categoryId === categoryFilter);
  }, [nonInvestment, categoryFilter]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="label-sm">History</span>
        <h1 className="heading-xl">All transactions</h1>
      </header>

      {usedCategories.length > 0 && (
        <div className="relative -mx-1">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto px-1 pb-1">
            <FilterPill
              label="All"
              active={categoryFilter === ALL_FILTER}
              onClick={() => setCategoryFilter(ALL_FILTER)}
            />
            {usedCategories.map((c) => (
              <FilterPill
                key={c.id}
                label={c.name}
                active={categoryFilter === c.id}
                onClick={() => setCategoryFilter(c.id)}
              />
            ))}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-8"
            style={{
              background:
                "linear-gradient(to left, var(--color-bg), transparent)",
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="surface p-8 text-center text-sm text-fg-muted">
          Loading…
        </div>
      ) : (
        <TransactionList
          transactions={filtered}
          accountsById={accountsById}
          categoriesById={categoriesById}
          onDelete={remove}
          onSelect={setSelected}
          groupByDate
          emptyMessage={
            categoryFilter === ALL_FILTER
              ? "No transactions yet."
              : "No transactions in this category."
          }
        />
      )}

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
        title="Edit transaction"
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
    </div>
  );
}

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 h-8 px-3 rounded-full text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        active
          ? "bg-accent text-white"
          : "bg-surface-2 text-fg-muted border border-border hover:text-fg hover:border-border-strong",
      )}
    >
      {label}
    </button>
  );
}
