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
} from "@/lib/utils/budgets";
import type { Budget, NewBudget, Transaction } from "@/lib/types";
import type { BudgetProgress, UsdRates } from "@/lib/utils/budgets";

export function useBudgets() {
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
      const updated = await budgetStore.update(id, patch, target?._owner?.uid);
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

  const monthKey = currentMonthKey();

  // Every non-USD currency used by a budget or by this month's expenses.
  // Only cross-currency spend needs a rate; same-currency spend is used as-is.
  const neededCurrencies = useMemo(() => {
    const set = new Set<string>();
    for (const b of budgets) set.add(b.currency);
    for (const t of transactions) {
      if (t.type === "expense" && t.date.startsWith(monthKey)) {
        set.add(t.currency);
      }
    }
    set.delete("USD");
    return [...set].sort().join(",");
  }, [budgets, transactions, monthKey]);

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
