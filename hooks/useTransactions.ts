"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { transactionStore } from "@/lib/storage";
import type { NewTransaction, Transaction } from "@/lib/types";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transactionStore.list().then((items) => {
      setTransactions(items);
      setLoading(false);
    });
  }, []);

  const add = useCallback(async (input: NewTransaction) => {
    const created = await transactionStore.add(input);
    setTransactions((prev) => [created, ...prev]);
  }, []);

  const remove = useCallback(async (id: string) => {
    await transactionStore.remove(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === "income") income += t.amountUSD;
      else expense += t.amountUSD;
    }
    return { income, expense, balance: income - expense };
  }, [transactions]);

  return { transactions, loading, add, remove, totals };
}
