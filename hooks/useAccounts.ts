"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { accountStore, transactionStore } from "@/lib/storage";
import type { Account, NewAccount, Transaction } from "@/lib/types";

function computeDerived(accounts: Account[], transactions: Transaction[]) {
  const balances: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const a of accounts) {
    balances[a.id] = a.initialBalance;
    counts[a.id] = 0;
  }
  for (const t of transactions) {
    const delta = t.type === "income" ? t.amount : -t.amount;
    balances[t.accountId] = (balances[t.accountId] ?? 0) + delta;
    counts[t.accountId] = (counts[t.accountId] ?? 0) + 1;
  }
  return { balances, counts };
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [txCountByAccount, setTxCountByAccount] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([accountStore.list(), transactionStore.list()]).then(
      ([nextAccounts, transactions]) => {
        const derived = computeDerived(nextAccounts, transactions);
        setAccounts(nextAccounts);
        setBalances(derived.balances);
        setTxCountByAccount(derived.counts);
        setLoading(false);
      },
    );
  }, []);

  const refresh = useCallback(() => {
    return Promise.all([accountStore.list(), transactionStore.list()]).then(
      ([nextAccounts, transactions]) => {
        const derived = computeDerived(nextAccounts, transactions);
        setAccounts(nextAccounts);
        setBalances(derived.balances);
        setTxCountByAccount(derived.counts);
      },
    );
  }, []);

  const add = useCallback(
    async (input: NewAccount) => {
      const created = await accountStore.add(input);
      await refresh();
      return created;
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, patch: Partial<NewAccount>) => {
      const updated = await accountStore.update(id, patch);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const count = txCountByAccount[id] ?? 0;
      if (count > 0) {
        throw new Error(
          `This account has ${count} transaction${count === 1 ? "" : "s"}. Delete or reassign them before deleting the account.`,
        );
      }
      await accountStore.remove(id);
      await refresh();
    },
    [refresh, txCountByAccount],
  );

  const byId = useMemo(() => {
    const map: Record<string, Account> = {};
    for (const a of accounts) map[a.id] = a;
    return map;
  }, [accounts]);

  return {
    accounts,
    balances,
    txCountByAccount,
    byId,
    loading,
    add,
    update,
    remove,
  };
}
