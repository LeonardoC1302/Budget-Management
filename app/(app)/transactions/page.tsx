"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/atoms/Modal";
import RowSkeleton from "@/components/atoms/RowSkeleton";
import Select from "@/components/atoms/Select";
import RefundForm from "@/components/molecules/RefundForm";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import TransactionDetailsModal from "@/components/molecules/TransactionDetailsModal";
import TransactionForm from "@/components/molecules/TransactionForm";
import TransactionList from "@/components/organisms/TransactionList";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { monthKeyOffset } from "@/lib/utils/analytics";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatDate, todayISODate } from "@/lib/utils/format";
import { isUpcomingInstallment } from "@/lib/utils/installments";
import { countsAsIncome, refundedByExpense, spendSign } from "@/lib/utils/refunds";
import { collectTags, normalizeTag } from "@/lib/utils/tags";
import type { Account, Category, Transaction } from "@/lib/types";

import { t, tn } from "@/lib/i18n";
const ALL_FILTER = "__all__";

type Period = "all" | "this-month" | "last-month" | "3-months" | "this-year";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "3-months", label: "Last 3 months" },
  { value: "this-year", label: "This year" },
];

function inPeriod(date: string, period: Period): boolean {
  const month = date.slice(0, 7);
  switch (period) {
    case "all":
      return true;
    case "this-month":
      return month === monthKeyOffset(0);
    case "last-month":
      return month === monthKeyOffset(-1);
    case "3-months":
      return month >= monthKeyOffset(-2);
    case "this-year":
      return date.slice(0, 4) === monthKeyOffset(0).slice(0, 4);
  }
}

/**
 * Every whitespace-separated term must match somewhere: description,
 * category, account, a tag ("#japan" or "japan"), or the amount ("12.5").
 */
function matchesSearch(
  t: Transaction,
  terms: string[],
  accountsById: Record<string, Account>,
  categoriesById: Record<string, Category>,
): boolean {
  if (terms.length === 0) return true;
  const haystack = [
    t.description,
    categoriesById[t.categoryId]?.name,
    accountsById[t.accountId]?.name,
    t.linkedAccountId ? accountsById[t.linkedAccountId]?.name : "",
    t.refundOf ? "refund" : "",
    t.amount.toFixed(2),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const tags = t.tags ?? [];
  return terms.every((term) => {
    if (term.startsWith("#")) {
      const tag = normalizeTag(term);
      return !!tag && tags.some((t) => t.startsWith(tag));
    }
    return haystack.includes(term) || tags.some((t) => t.includes(term));
  });
}

export default function TransactionsPage() {
  const { transactions, add, remove, update, loading } = useTransactions();
  const { byId: accountsById } = useAccounts();
  const { byId: categoriesById } = useCategories();
  const { displayCurrency, convertUsd } = usePreferences();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [refunding, setRefunding] = useState<Transaction | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_FILTER);
  const [accountFilter, setAccountFilter] = useState<string>(ALL_FILTER);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [search, setSearch] = useState("");
  const filtersRef = useRef<HTMLDivElement>(null);

  // Future installment slices live on the Cards page until their date.
  const today = todayISODate();
  const nonInvestment = useMemo(
    () =>
      transactions.filter(
        (t) => t.type !== "investment" && !isUpcomingInstallment(t, today),
      ),
    [transactions, today],
  );
  const upcomingInstallmentCount = useMemo(
    () => transactions.filter((t) => isUpcomingInstallment(t, today)).length,
    [transactions, today],
  );

  const byId = useMemo(() => {
    const map: Record<string, Transaction> = {};
    for (const t of transactions) map[t.id] = t;
    return map;
  }, [transactions]);

  const refunded = useMemo(() => refundedByExpense(transactions), [transactions]);
  const tags = useMemo(() => collectTags(nonInvestment), [nonInvestment]);

  const usedCategories = useMemo(() => {
    const ids = new Set<string>();
    for (const t of nonInvestment) {
      if (t.categoryId) ids.add(t.categoryId);
    }
    return Array.from(ids)
      .map((id) => ({
        id,
        name: categoriesById[id]?.name ?? t("Unknown"),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [nonInvestment, categoriesById]);

  const terms = useMemo(
    () => search.toLowerCase().split(/\s+/).filter(Boolean),
    [search],
  );

  const filtered = useMemo(() => {
    return nonInvestment.filter(
      (t) =>
        (categoryFilter === ALL_FILTER || t.categoryId === categoryFilter) &&
        (accountFilter === ALL_FILTER || t.accountId === accountFilter) &&
        (!tagFilter || (t.tags ?? []).includes(tagFilter)) &&
        inPeriod(t.date, period) &&
        matchesSearch(t, terms, accountsById, categoriesById),
    );
  }, [
    nonInvestment,
    categoryFilter,
    accountFilter,
    tagFilter,
    period,
    terms,
    accountsById,
    categoriesById,
  ]);

  const accountOptions = useMemo(
    () => [
      { value: ALL_FILTER, label: t("All accounts") },
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

  const anyFilter =
    categoryFilter !== ALL_FILTER ||
    accountFilter !== ALL_FILTER ||
    !!tagFilter ||
    period !== "all" ||
    terms.length > 0;

  function clearFilters() {
    setCategoryFilter(ALL_FILTER);
    setAccountFilter(ALL_FILTER);
    setTagFilter(null);
    setPeriod("all");
    setSearch("");
  }

  const refundOriginal = editing?.refundOf ? byId[editing.refundOf] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead kicker={t("History")} title={t("The ledger")} />

      <div className="flex flex-col gap-3">
        <div className="field">
          <label htmlFor="ledger-search" className="sr-only">
            {t("Search transactions")}
          </label>
          <input
            id="ledger-search"
            type="search"
            className="input"
            placeholder={t("Search description, category, amount or #tag")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label={t("Account")}
            options={accountOptions}
            value={accountFilter}
            onChange={setAccountFilter}
            className="w-full"
          />
          <Select
            label={t("Period")}
            options={PERIOD_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
            value={period}
            onChange={(v) => setPeriod(v as Period)}
            className="w-full"
          />
        </div>

        {usedCategories.length > 0 && (
          <div className="relative -mx-1">
            <div
              ref={filtersRef}
              className="scrollbar-hide flex gap-1 overflow-x-auto px-1 pb-1"
              role="tablist"
              aria-label={t("Filter by category")}
            >
              <FilterPill
                label={t("All")}
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

        {tags.length > 0 && (
          <div
            className="scrollbar-hide flex gap-1 overflow-x-auto -mx-1 px-1 pb-1"
            aria-label={t("Filter by tag")}
          >
            {tags.map((tag) => (
              <FilterPill
                key={tag}
                label={`#${tag}`}
                active={tagFilter === tag}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              />
            ))}
          </div>
        )}

        {anyFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="self-start text-xs text-fg-subtle hover:text-fg underline underline-offset-2"
          >
            {t("Clear filters")}
          </button>
        )}
      </div>

      {tagFilter && !loading && (
        <TagSummary
          tag={tagFilter}
          transactions={filtered}
          categoriesById={categoriesById}
          displayCurrency={displayCurrency}
          convertUsd={convertUsd}
        />
      )}

      {!loading && upcomingInstallmentCount > 0 && !anyFilter && (
        <p className="text-xs text-fg-subtle">
          {tn(
            "{count} future installment charge will appear here on its date.",
            "{count} future installment charges will appear here on their dates.",
            upcomingInstallmentCount,
          )}{" "}
          {t("The Cards page lists them now.")}
        </p>
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
            anyFilter
              ? t("Nothing matches these filters yet.")
              : t("No entries have been set down yet.")
          }
          emptyDescription={
            anyFilter
              ? t("Try a different search or filter, or add a new transaction.")
              : t("Add your first entry — income, expense, or transfer — to start seeing the shape of the month.")
          }
          emptyActionLabel={anyFilter ? undefined : t("Add a transaction")}
          emptyActionHref={anyFilter ? undefined : "/add"}
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
        refundOf={selected?.refundOf ? byId[selected.refundOf] : undefined}
        refunded={selected ? (refunded[selected.id] ?? 0) : 0}
        onRefund={(t) => {
          setSelected(null);
          setRefunding(t);
        }}
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
        title={editing?.refundOf ? t("Edit refund") : t("Edit transaction")}
      >
        {editing &&
          (editing.refundOf ? (
            refundOriginal ? (
              <RefundForm
                original={refundOriginal}
                alreadyRefunded={refunded[refundOriginal.id] ?? 0}
                initial={editing}
                onSubmit={async (input) => {
                  await update(editing.id, input);
                  setEditing(null);
                }}
              />
            ) : (
              <p className="text-sm text-fg-muted">
                {t("The expense this refund belongs to was deleted. Restore it from Recently deleted to edit the refund, or delete the refund.")}
              </p>
            )
          ) : (
            <TransactionForm
              initial={editing}
              onSubmit={async (input) => {
                await update(editing.id, input);
                setEditing(null);
              }}
            />
          ))}
      </Modal>

      <Modal
        open={!!refunding}
        onClose={() => setRefunding(null)}
        title={t("Record refund")}
      >
        {refunding && (
          <RefundForm
            original={refunding}
            alreadyRefunded={refunded[refunding.id] ?? 0}
            onSubmit={async (input) => {
              await add(input);
              setRefunding(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

interface TagSummaryProps {
  tag: string;
  transactions: Transaction[];
  categoriesById: Record<string, Category>;
  displayCurrency: string;
  convertUsd: (usd: number) => number;
}

/** What a tag adds up to: net spend, by category, over its date span. */
function TagSummary({
  tag,
  transactions,
  categoriesById,
  displayCurrency,
  convertUsd,
}: TagSummaryProps) {
  const summary = useMemo(() => {
    let spent = 0;
    let income = 0;
    const byCategory: Record<string, number> = {};
    let first: string | null = null;
    let last: string | null = null;
    for (const t of transactions) {
      const sign = spendSign(t);
      if (sign !== 0) {
        spent += sign * t.amountUSD;
        byCategory[t.categoryId] = (byCategory[t.categoryId] ?? 0) + sign * t.amountUSD;
      } else if (countsAsIncome(t)) {
        income += t.amountUSD;
      }
      if (!first || t.date < first) first = t.date;
      if (!last || t.date > last) last = t.date;
    }
    const categories = Object.entries(byCategory)
      .filter(([, v]) => v > 0.005)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return { spent, income, categories, first, last };
  }, [transactions]);

  const fmt = (usd: number) => formatCurrency(convertUsd(usd), displayCurrency);

  return (
    <section className="surface p-5 flex flex-col gap-3" aria-label={t("Summary for #{tag}", { tag })}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="kicker">#{tag}</span>
        <span className="text-xs text-fg-subtle">
          {tn("{count} entry", "{count} entries", transactions.length)}
          {summary.first && summary.last
            ? ` · ${formatDate(summary.first)}${summary.first !== summary.last ? ` – ${formatDate(summary.last)}` : ""}`
            : ""}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-medium tracking-tight">{fmt(summary.spent)}</span>
        <span className="text-sm text-fg-muted">{t("spent")}</span>
        {summary.income > 0 && (
          <span className="text-sm text-income ml-auto">{t("+{amount} in", { amount: fmt(summary.income) })}</span>
        )}
      </div>
      {summary.categories.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {summary.categories.map(([id, usd]) => (
            <li key={id} className="flex justify-between gap-3">
              <span className="text-fg-muted">{categoriesById[id]?.name ?? t("Other")}</span>
              <span>{fmt(usd)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
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
