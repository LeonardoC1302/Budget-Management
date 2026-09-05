"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { subscribeDataChanged } from "@/lib/events/dataChanged";
import { transactionStore } from "@/lib/storage";
import type { NewTransaction, NewTransfer, Transaction } from "@/lib/types";

function sortByTransactionDate(items: Transaction[]): Transaction[] {
  return [...items].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const items = await transactionStore.list();
    setTransactions(sortByTransactionDate(items));
  }, []);

  useEffect(() => {
    transactionStore.list().then((items) => {
      setTransactions(sortByTransactionDate(items));
      setLoading(false);
    });
  }, []);

  useEffect(() => subscribeDataChanged(() => void refresh()), [refresh]);

  const add = useCallback(async (input: NewTransaction) => {
    const created = await transactionStore.add(input);
    setTransactions((prev) => sortByTransactionDate([created, ...prev]));
  }, []);

  const addTransfer = useCallback(
    async (input: NewTransfer) => {
      await transactionStore.addTransfer(input);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(async (id: string) => {
    const target = transactions.find((t) => t.id === id);
    const ownerUid = target?._owner?.uid;
    if (target?.transferId) {
      await transactionStore.removeTransfer(target.transferId, ownerUid);
      setTransactions((prev) =>
        prev.filter((t) => t.transferId !== target.transferId),
      );
      return;
    }
    await transactionStore.remove(id, ownerUid);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, [transactions]);

  const update = useCallback(
    async (id: string, input: NewTransaction) => {
      const target = transactions.find((t) => t.id === id);
      const updated = await transactionStore.update(
        id,
        input,
        target?._owner?.uid,
      );
      setTransactions((prev) =>
        sortByTransactionDate(prev.map((t) => (t.id === id ? updated : t))),
      );
    },
    [transactions],
  );

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === "income") income += t.amountUSD;
      else if (t.type === "expense") expense += t.amountUSD;
    }
    return { income, expense, balance: income - expense };
  }, [transactions]);

  return { transactions, loading, add, addTransfer, update, remove, totals, refresh };
}
