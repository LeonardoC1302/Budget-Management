"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/atoms/Modal";
import RowSkeleton from "@/components/atoms/RowSkeleton";
import Select from "@/components/atoms/Select";
import RouteMasthead from "@/components/molecules/RouteMasthead";
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
  const [accountFilter, setAccountFilter] = useState<string>(ALL_FILTER);
  const filtersRef = useRef<HTMLDivElement>(null);

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
    return nonInvestment.filter(
      (t) =>
        (categoryFilter === ALL_FILTER || t.categoryId === categoryFilter) &&
        (accountFilter === ALL_FILTER || t.accountId === accountFilter),
    );
  }, [nonInvestment, categoryFilter, accountFilter]);

  const accountOptions = useMemo(
    () => [
      { value: ALL_FILTER, label: "All accounts" },
      ...(accountsById
        ? Object.values(accountsById)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((account) => ({ value: account.id, label: account.name }))
        : []),
    ],
    [accountsById],
  );

  useEffect(() => {
    const el = filtersRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [usedCategories.length]);

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead kicker="History" title="The ledger" />

      {(accountOptions.length > 1 || usedCategories.length > 0) && (
        <div className="flex flex-col gap-3">
          {accountOptions.length > 1 && (
            <Select
              label="Account"
              options={accountOptions}
              value={accountFilter}
              onChange={setAccountFilter}
              className="w-full sm:max-w-xs"
            />
          )}

          {usedCategories.length > 0 && (
            <div className="relative -mx-1">
              <div
                ref={filtersRef}
                className="scrollbar-hide flex gap-1 overflow-x-auto px-1 pb-1"
                role="tablist"
                aria-label="Filter by category"
              >
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
        </div>
      )}

      {loading ? (
        <RowSkeleton count={5} />
      ) : (
        <TransactionList
          transactions={filtered}
          accountsById={accountsById}
          categoriesById={categoriesById}
          onSelect={setSelected}
          groupByDate
          groupTransfers={accountFilter === ALL_FILTER}
          emptyTitle={
            categoryFilter === ALL_FILTER && accountFilter === ALL_FILTER
              ? "No entries have been set down yet."
              : "Nothing matches these filters yet."
          }
          emptyDescription={
            categoryFilter === ALL_FILTER && accountFilter === ALL_FILTER
              ? "Add your first entry — income, expense, or transfer — to start seeing the shape of the month."
              : "Try a different account or category filter, or add a new transaction."
          }
          emptyActionLabel={
            categoryFilter === ALL_FILTER && accountFilter === ALL_FILTER
              ? "Add a transaction"
              : undefined
          }
          emptyActionHref={
            categoryFilter === ALL_FILTER && accountFilter === ALL_FILTER
              ? "/add"
              : undefined
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
        onDelete={remove}
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
      className={cn("filter shrink-0")}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
