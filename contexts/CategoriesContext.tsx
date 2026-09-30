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
import { emitDataChanged, subscribeDataChanged } from "@/lib/events/dataChanged";
import { announceRemoval } from "@/lib/events/undo";
import type { Category, NewCategory, TransactionType } from "@/lib/types";

import { t, tn } from "@/lib/i18n";
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

  useEffect(() => subscribeDataChanged(() => void refresh()), [refresh]);

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
        throw new Error(t("Default categories cannot be deleted."));
      }
      const count = usage[id] ?? 0;
      if (count > 0) {
        throw new Error(
          tn("This category is used by {count} transaction.", "This category is used by {count} transactions.", count),
        );
      }
      const budgets = await budgetStore.list();
      const orphanedBudgets = budgets.filter((b) => b.categoryId === id);
      const removed: { ownerUid?: string; trashId: string | void }[] = [];
      for (const b of orphanedBudgets) {
        const ownerUid = b._owner?.uid;
        removed.push({ ownerUid, trashId: await budgetStore.remove(b.id, ownerUid) });
      }
      const ownerUid = target?._owner?.uid;
      removed.push({ ownerUid, trashId: await categoryStore.remove(id, ownerUid) });
      await refresh();
      announceRemoval("Category deleted", removed);
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
