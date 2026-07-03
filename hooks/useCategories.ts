"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { categoryStore, transactionStore } from "@/lib/storage";
import type { Category, NewCategory, Transaction, TransactionType } from "@/lib/types";

function computeUsage(transactions: Transaction[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const t of transactions) {
    map[t.categoryId] = (map[t.categoryId] ?? 0) + 1;
  }
  return map;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([categoryStore.list(), transactionStore.list()]).then(
      ([nextCategories, transactions]) => {
        setCategories(nextCategories);
        setUsage(computeUsage(transactions));
        setLoading(false);
      },
    );
  }, []);

  const refresh = useCallback(() => {
    return Promise.all([categoryStore.list(), transactionStore.list()]).then(
      ([nextCategories, transactions]) => {
        setCategories(nextCategories);
        setUsage(computeUsage(transactions));
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
      await categoryStore.remove(id);
      await refresh();
    },
    [categories, refresh, usage],
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

  return {
    categories,
    byId,
    usage,
    loading,
    add,
    remove,
    filterByType,
  };
}
