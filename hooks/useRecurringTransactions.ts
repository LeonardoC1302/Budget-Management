"use client";

import { useCallback, useEffect, useState } from "react";
import { emitDataChanged, subscribeDataChanged } from "@/lib/events/dataChanged";
import { runMaterialization } from "@/lib/recurring/runMaterialization";
import { recurringTransactionStore } from "@/lib/storage";
import type {
  NewRecurringTransaction,
  RecurringTransaction,
} from "@/lib/types";

/**
 * One-time soft-migration: legacy investment recurring templates are paused
 * on first load after the Invest tab was removed from the recurring form.
 * They remain visible under "Retired" so the user can delete them at will.
 */
async function retireLegacyInvestments(
  templates: RecurringTransaction[],
): Promise<RecurringTransaction[]> {
  const changes = templates.filter(
    (t) => t.type === "investment" && t.active,
  );
  if (changes.length === 0) return templates;
  await Promise.all(
    changes.map((t) =>
      recurringTransactionStore.update(t.id, { active: false }, t._owner?.uid),
    ),
  );
  return templates.map((t) =>
    t.type === "investment" && t.active ? { ...t, active: false } : t,
  );
}

export function useRecurringTransactions() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recurringTransactionStore
      .list()
      .then(retireLegacyInvestments)
      .then((items) => {
        setRecurring(items);
        setLoading(false);
      });
  }, []);

  const refresh = useCallback(async () => {
    const items = await recurringTransactionStore.list();
    setRecurring(items);
  }, []);

  useEffect(() => subscribeDataChanged(() => void refresh()), [refresh]);

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
      const target = recurring.find((r) => r.id === id);
      const updated = await recurringTransactionStore.update(
        id,
        patch,
        target?._owner?.uid,
      );
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
    [recurring],
  );

  const remove = useCallback(
    async (id: string) => {
      const target = recurring.find((r) => r.id === id);
      await recurringTransactionStore.remove(id, target?._owner?.uid);
      setRecurring((prev) => prev.filter((r) => r.id !== id));
    },
    [recurring],
  );

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
