"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { subscribeDataChanged } from "@/lib/events/dataChanged";
import { announceRemoval } from "@/lib/events/undo";
import { getRate } from "@/lib/services/exchangeRates";
import { budgetStore, transactionStore } from "@/lib/storage";
import {
  computeBudgetProgress,
  computeBudgetTotals,
  computeCategorySpend,
  convertAmount,
  currentMonthKey,
  nextCapHistory,
} from "@/lib/utils/budgets";
import type { Budget, NewBudget, Transaction } from "@/lib/types";
import type { BudgetProgress, UsdRates } from "@/lib/utils/budgets";

export const HISTORY_MONTHS = 6;

export interface BudgetMonth {
  monthKey: string;
  // Totals across budgets active that month, in the summary currency.
  cap: number;
  spent: number;
  // Per-budget progress for that month, keyed by category.
  byCategory: Record<string, BudgetProgress>;
}

/**
 * Budgets with progress for `monthKey` (default: the current month) plus the
 * six months ending there, for the history chart.
 */
export function useBudgets(selectedMonth?: string) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [usdRates, setUsdRates] = useState<UsdRates>({});

  useEffect(() => {
    Promise.all([budgetStore.list(), transactionStore.list()]).then(
      ([b, t]) => {
        setBudgets(b);
        setTransactions(t);
        setLoading(false);
      },
    );
  }, []);

  const refresh = useCallback(
    () =>
      Promise.all([budgetStore.list(), transactionStore.list()]).then(
        ([b, t]) => {
          setBudgets(b);
          setTransactions(t);
        },
      ),
    [],
  );

  useEffect(() => subscribeDataChanged(() => void refresh()), [refresh]);

  const add = useCallback(
    async (input: NewBudget) => {
      const created = await budgetStore.add(input);
      await refresh();
      return created;
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, patch: Partial<NewBudget>) => {
      const target = budgets.find((b) => b.id === id);
      const capChanged =
        !!target &&
        ((patch.amount !== undefined && patch.amount !== target.amount) ||
          (patch.currency !== undefined && patch.currency !== target.currency));
      // Keep the old cap for earlier months before overwriting it.
      const withHistory = capChanged
        ? { ...patch, capHistory: nextCapHistory(target, currentMonthKey()) }
        : patch;
      const updated = await budgetStore.update(
        id,
        withHistory,
        target?._owner?.uid,
      );
      await refresh();
      return updated;
    },
    [budgets, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const target = budgets.find((b) => b.id === id);
      const ownerUid = target?._owner?.uid;
      const trashId = await budgetStore.remove(id, ownerUid);
      await refresh();
      announceRemoval("Budget deleted", [{ ownerUid, trashId }]);
    },
    [budgets, refresh],
  );

  const monthKey = selectedMonth ?? currentMonthKey();
  const historyKeys = useMemo(() => {
    const [y, m] = monthKey.split("-").map(Number);
    return Array.from({ length: HISTORY_MONTHS }, (_, i) => {
      const d = new Date(y, m - 1 - (HISTORY_MONTHS - 1 - i), 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  }, [monthKey]);

  // Every non-USD currency used by a budget or by this month's expenses.
  // Only cross-currency spend needs a rate; same-currency spend is used as-is.
  const neededCurrencies = useMemo(() => {
    const set = new Set<string>();
    for (const b of budgets) set.add(b.currency);
    for (const t of transactions) {
      if (
        (t.type === "expense" || t.refundOf) &&
        t.date.slice(0, 7) >= historyKeys[0] &&
        t.date.slice(0, 7) <= monthKey
      ) {
        set.add(t.currency);
      }
    }
    for (const b of budgets) {
      for (const h of b.capHistory ?? []) set.add(h.currency);
    }
    set.delete("USD");
    return [...set].sort().join(",");
  }, [budgets, transactions, monthKey, historyKeys]);

  useEffect(() => {
    const missing = neededCurrencies
      .split(",")
      .filter((c) => c && usdRates[c] === undefined);
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(
      missing.map((c) =>
        getRate("USD", c).then(
          (rate) => [c, rate] as const,
          () => null,
        ),
      ),
    ).then((results) => {
      if (cancelled) return;
      const loaded = results.filter((r) => r !== null);
      if (loaded.length === 0) return;
      setUsdRates((prev) => ({ ...prev, ...Object.fromEntries(loaded) }));
    });
    return () => {
      cancelled = true;
    };
  }, [neededCurrencies, usdRates]);

  const summaryCurrency = budgets[0]?.currency ?? "USD";
  const byCategoryId = useMemo(() => {
    const map: Record<string, Budget> = {};
    for (const b of budgets) map[b.categoryId] = b;
    return map;
  }, [budgets]);

  const progressByCategory = useMemo(() => {
    const map: Record<string, BudgetProgress> = {};
    for (const b of budgets) {
      map[b.categoryId] = computeBudgetProgress(
        b,
        transactions,
        monthKey,
        usdRates,
      );
    }
    return map;
  }, [budgets, transactions, monthKey, usdRates]);

  const history = useMemo<BudgetMonth[]>(
    () =>
      historyKeys.map((key) => {
        const byCategory: Record<string, BudgetProgress> = {};
        for (const b of budgets) {
          byCategory[b.categoryId] = computeBudgetProgress(
            b,
            transactions,
            key,
            usdRates,
          );
        }
        const t = computeBudgetTotals(
          budgets,
          transactions,
          key,
          summaryCurrency,
          usdRates,
        );
        return { monthKey: key, cap: t.totalCap, spent: t.totalSpent, byCategory };
      }),
    [historyKeys, budgets, transactions, summaryCurrency, usdRates],
  );

  const totals = useMemo(
    () =>
      computeBudgetTotals(
        budgets,
        transactions,
        monthKey,
        summaryCurrency,
        usdRates,
      ),
    [budgets, transactions, monthKey, summaryCurrency, usdRates],
  );

  const wouldExceed = useCallback(
    (categoryId: string, addedAmount: number, currency: string): boolean => {
      const budget = byCategoryId[categoryId];
      if (!budget) return false;
      const added = convertAmount(
        addedAmount,
        currency,
        budget.currency,
        usdRates,
      );
      if (added === null) return false;
      const spent = computeCategorySpend(
        transactions,
        categoryId,
        monthKey,
        budget.currency,
        usdRates,
      );
      return spent + added > budget.amount;
    },
    [byCategoryId, transactions, monthKey, usdRates],
  );

  return {
    budgets,
    history,
    byCategoryId,
    progressByCategory,
    totals,
    summaryCurrency,
    monthKey,
    loading,
    add,
    update,
    remove,
    wouldExceed,
  };
}
