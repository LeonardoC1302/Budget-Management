"use client";

import { useCallback, useEffect, useState } from "react";
import { emitDataChanged } from "@/lib/events/dataChanged";
import { runMaterialization } from "@/lib/recurring/runMaterialization";
import { recurringTransactionStore } from "@/lib/storage";
import type {
  NewRecurringTransaction,
  RecurringTransaction,
} from "@/lib/types";

export function useRecurringTransactions() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recurringTransactionStore.list().then((items) => {
      setRecurring(items);
      setLoading(false);
    });
  }, []);

  const refresh = useCallback(async () => {
    const items = await recurringTransactionStore.list();
    setRecurring(items);
  }, []);

  const add = useCallback(async (input: NewRecurringTransaction) => {
    const created = await recurringTransactionStore.add(input);
    // Immediately materialize any occurrences due since startDate.
    const inserted = await runMaterialization([created]);
    // Reload templates so `lastGeneratedDate` on `created` is fresh.
    const items = await recurringTransactionStore.list();
    setRecurring(items);
    if (inserted) emitDataChanged();
    return created;
  }, []);

  const update = useCallback(
    async (
      id: string,
      patch: Partial<Omit<RecurringTransaction, "id" | "createdAt">>,
    ) => {
      const updated = await recurringTransactionStore.update(id, patch);
      setRecurring((prev) => prev.map((r) => (r.id === id ? updated : r)));
      // If the template was reactivated or its start/frequency changed, run
      // materialization so any newly-due occurrences appear.
      const inserted = await runMaterialization([updated]);
      if (inserted) {
        const items = await recurringTransactionStore.list();
        setRecurring(items);
        emitDataChanged();
      }
      return updated;
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    await recurringTransactionStore.remove(id);
    setRecurring((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleActive = useCallback(
    async (id: string) => {
      const target = recurring.find((r) => r.id === id);
      if (!target) return;
      await update(id, { active: !target.active });
    },
    [recurring, update],
  );

  return { recurring, loading, add, update, remove, toggleActive, refresh };
}
