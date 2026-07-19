"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { budgetStore, categoryStore, transactionStore } from "@/lib/storage";
import { emitDataChanged } from "@/lib/events/dataChanged";
import type { Category, NewCategory, TransactionType } from "@/lib/types";

interface CategoriesContextValue {
  categories: Category[];
  byId: Record<string, Category>;
  usage: Record<string, number>;
  loading: boolean;
  add: (input: NewCategory) => Promise<Category>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  filterByType: (type: TransactionType) => Category[];
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

function computeUsage(
  transactions: { categoryId: string }[],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const t of transactions) {
    map[t.categoryId] = (map[t.categoryId] ?? 0) + 1;
  }
  return map;
}

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [nextCategories, transactions] = await Promise.all([
      categoryStore.list(),
      transactionStore.list(),
    ]);
    setCategories(nextCategories);
    setUsage(computeUsage(transactions));
  }, []);

  useEffect(() => {
    Promise.all([categoryStore.list(), transactionStore.list()]).then(
      ([nextCategories, transactions]) => {
        setCategories(nextCategories);
        setUsage(computeUsage(transactions));
        setLoading(false);
      },
    );
  }, []);

  const add = useCallback(
    async (input: NewCategory) => {
      const created = await categoryStore.add(input);
      await refresh();
      return created;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const target = categories.find((c) => c.id === id);
      if (target?.isDefault) {
        throw new Error("Default categories cannot be deleted.");
      }
      const count = usage[id] ?? 0;
      if (count > 0) {
        throw new Error(
          `This category is used by ${count} transaction${count === 1 ? "" : "s"}.`,
        );
      }
      const budgets = await budgetStore.list();
      const orphanedBudgets = budgets.filter((b) => b.categoryId === id);
      for (const b of orphanedBudgets) {
        await budgetStore.remove(b.id);
      }
      await categoryStore.remove(id);
      await refresh();
      if (orphanedBudgets.length > 0) emitDataChanged();
    },
    [categories, usage, refresh],
  );

  const byId = useMemo(() => {
    const map: Record<string, Category> = {};
    for (const c of categories) map[c.id] = c;
    return map;
  }, [categories]);

  const filterByType = useCallback(
    (type: TransactionType) => categories.filter((c) => c.type === type),
    [categories],
  );

  const value = useMemo<CategoriesContextValue>(
    () => ({
      categories,
      byId,
      usage,
      loading,
      add,
      remove,
      refresh,
      filterByType,
    }),
    [categories, byId, usage, loading, add, remove, refresh, filterByType],
  );

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategoriesContext(): CategoriesContextValue {
  const ctx = useContext(CategoriesContext);
  if (!ctx)
    throw new Error(
      "useCategories must be used inside <CategoriesProvider>",
    );
  return ctx;
}
