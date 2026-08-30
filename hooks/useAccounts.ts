"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { subscribeDataChanged } from "@/lib/events/dataChanged";
import { accountStore, goalStore, transactionStore } from "@/lib/storage";
import { computeCardTotals, type CardTotals } from "@/lib/credit/statement";
import type {
  Account,
  Goal,
  GoalContribution,
  NewAccount,
  Transaction,
} from "@/lib/types";

function computeDerived(accounts: Account[], transactions: Transaction[]) {
  const balances: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const a of accounts) {
    balances[a.id] = a.initialBalance;
    counts[a.id] = 0;
  }
  for (const t of transactions) {
    // Use amount converted to the account's currency so mixed-currency
    // transactions (e.g. a CRC purchase on a USD card) don't corrupt the
    // balance. Falls back to `amount` for legacy docs where currency matched.
    const nativeAmount = t.accountAmount ?? t.amount;
    let delta = 0;
    if (t.type === "income") delta = nativeAmount;
    else if (t.type === "expense") delta = -nativeAmount;
    else if (t.type === "investment") delta = -nativeAmount;
    else if (t.type === "transfer")
      delta = t.transferDirection === "in" ? nativeAmount : -nativeAmount;
    balances[t.accountId] = (balances[t.accountId] ?? 0) + delta;
    counts[t.accountId] = (counts[t.accountId] ?? 0) + 1;
  }
  return { balances, counts };
}

function computeCreditTotals(
  accounts: Account[],
  transactions: Transaction[],
): Record<string, CardTotals> {
  const now = new Date();
  const out: Record<string, CardTotals> = {};
  for (const a of accounts) {
    if (a.type !== "credit") continue;
    const totals = computeCardTotals(a, transactions, now);
    if (totals) out[a.id] = totals;
  }
  return out;
}

export interface GoalReservation {
  goalId: string;
  goalName: string;
  amount: number;
}

function computeReservations(
  goals: Goal[],
  contributions: GoalContribution[],
): Record<string, GoalReservation[]> {
  const goalsById: Record<string, Goal> = {};
  for (const g of goals) goalsById[g.id] = g;

  // { accountId: { goalId: amount } }
  const sums: Record<string, Record<string, number>> = {};
  for (const c of contributions) {
    if (!c.accountId) continue; // legacy contributions without an account
    const goal = goalsById[c.goalId];
    if (!goal) continue;
    const perAccount = (sums[c.accountId] ??= {});
    perAccount[c.goalId] = (perAccount[c.goalId] ?? 0) + c.amount;
  }

  const out: Record<string, GoalReservation[]> = {};
  for (const [accountId, perGoal] of Object.entries(sums)) {
    out[accountId] = Object.entries(perGoal)
      .map(([goalId, amount]) => ({
        goalId,
        goalName: goalsById[goalId]?.name ?? "Goal",
        amount,
      }))
      .filter((r) => r.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }
  return out;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [txCountByAccount, setTxCountByAccount] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      accountStore.list(),
      transactionStore.list(),
      goalStore.listGoals(),
      goalStore.listContributions(),
    ]).then(([nextAccounts, nextTransactions, nextGoals, nextContribs]) => {
      const derived = computeDerived(nextAccounts, nextTransactions);
      setAccounts(nextAccounts);
      setTransactions(nextTransactions);
      setGoals(nextGoals);
      setContributions(nextContribs);
      setBalances(derived.balances);
      setTxCountByAccount(derived.counts);
      setLoading(false);
    });
  }, []);

  const refresh = useCallback(() => {
    return Promise.all([
      accountStore.list(),
      transactionStore.list(),
      goalStore.listGoals(),
      goalStore.listContributions(),
    ]).then(([nextAccounts, nextTransactions, nextGoals, nextContribs]) => {
      const derived = computeDerived(nextAccounts, nextTransactions);
      setAccounts(nextAccounts);
      setTransactions(nextTransactions);
      setGoals(nextGoals);
      setContributions(nextContribs);
      setBalances(derived.balances);
      setTxCountByAccount(derived.counts);
    });
  }, []);

  useEffect(() => subscribeDataChanged(() => void refresh()), [refresh]);

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
      const target = accounts.find((a) => a.id === id);
      const updated = await accountStore.update(id, patch, target?._owner?.uid);
      await refresh();
      return updated;
    },
    [accounts, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const count = txCountByAccount[id] ?? 0;
      if (count > 0) {
        throw new Error(
          `This account has ${count} transaction${count === 1 ? "" : "s"}. Delete or reassign them before deleting the account.`,
        );
      }
      const target = accounts.find((a) => a.id === id);
      await accountStore.remove(id, target?._owner?.uid);
      await refresh();
    },
    [accounts, refresh, txCountByAccount],
  );

  const byId = useMemo(() => {
    const map: Record<string, Account> = {};
    for (const a of accounts) map[a.id] = a;
    return map;
  }, [accounts]);

  const creditTotalsByAccount = useMemo(
    () => computeCreditTotals(accounts, transactions),
    [accounts, transactions],
  );

  const reservationsByAccount = useMemo(
    () => computeReservations(goals, contributions),
    [goals, contributions],
  );

  return {
    accounts,
    balances,
    txCountByAccount,
    byId,
    creditTotalsByAccount,
    reservationsByAccount,
    loading,
    add,
    update,
    remove,
    refresh,
  };
}
