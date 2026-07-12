"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { subscribeDataChanged } from "@/lib/events/dataChanged";
import { budgetStore, transactionStore } from "@/lib/storage";
import {
  computeBudgetProgress,
  computeBudgetTotals,
  computeCategorySpend,
  currentMonthKey,
} from "@/lib/utils/budgets";
import type { Budget, NewBudget, Transaction } from "@/lib/types";
import type { BudgetProgress } from "@/lib/utils/budgets";

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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
      const updated = await budgetStore.update(id, patch);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await budgetStore.remove(id);
      await refresh();
    },
    [refresh],
  );

  const monthKey = currentMonthKey();

  const byCategoryId = useMemo(() => {
    const map: Record<string, Budget> = {};
    for (const b of budgets) map[b.categoryId] = b;
    return map;
  }, [budgets]);

  const progressByCategory = useMemo(() => {
    const map: Record<string, BudgetProgress> = {};
    for (const b of budgets) {
      map[b.categoryId] = computeBudgetProgress(b, transactions, monthKey);
    }
    return map;
  }, [budgets, transactions, monthKey]);

  const totals = useMemo(
    () => computeBudgetTotals(budgets, transactions, monthKey),
    [budgets, transactions, monthKey],
  );

  const wouldExceed = useCallback(
    (categoryId: string, addedAmount: number): boolean => {
      const budget = byCategoryId[categoryId];
      if (!budget) return false;
      const spent = computeCategorySpend(transactions, categoryId, monthKey);
      return spent + addedAmount > budget.amount;
    },
    [byCategoryId, transactions, monthKey],
  );

  return {
    budgets,
    byCategoryId,
    progressByCategory,
    totals,
    monthKey,
    loading,
    add,
    update,
    remove,
    wouldExceed,
  };
}
