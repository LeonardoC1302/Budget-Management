"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { emitDataChanged, subscribeDataChanged } from "@/lib/events/dataChanged";
import { announceRemoval } from "@/lib/events/undo";
import { accountStore, goalStore, transactionStore } from "@/lib/storage";
import { computeCardTotals, type CardTotals } from "@/lib/credit/statement";
import { settleCard } from "@/lib/credit/settlement";
import { todayISODate } from "@/lib/utils/format";
import type {
  Account,
  Goal,
  GoalContribution,
  NewAccount,
  Transaction,
} from "@/lib/types";

import { t, tn } from "@/lib/i18n";
function computeDerived(accounts: Account[], transactions: Transaction[]) {
  const balances: Record<string, number> = {};
  const counts: Record<string, number> = {};
  // On cards, a payment counts for the charges it settles, matching the
  // Cards page (lib/credit/settlement).
  const settledPayment = new Map<string, number>();
  for (const a of accounts) {
    balances[a.id] = a.initialBalance;
    counts[a.id] = 0;
    if (a.type !== "credit") continue;
    for (const [id, amount] of settleCard(a, transactions).paymentAmount) {
      settledPayment.set(id, amount);
    }
  }
  for (const t of transactions) {
    // Use amount converted to the account's currency so mixed-currency
    // transactions (e.g. a CRC purchase on a USD card) don't corrupt the
    // balance. Falls back to `amount` for legacy docs where currency matched.
    const nativeAmount = settledPayment.get(t.id) ?? t.accountAmount ?? t.amount;
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
        goalName: goalsById[goalId]?.name ?? t("Goal"),
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
      const currencyChanged =
        patch.currency !== undefined && patch.currency !== target?.currency;
      if (currencyChanged) {
        await transactionStore.rebaseAccountCurrency(id, updated.currency);
      }
      await refresh();
      // Other hooks (the Cards page's statements, budgets, insights) hold
      // their own copy of the transactions; make them pick up the rebased
      // amounts instead of showing old-currency numbers until a reload.
      if (currencyChanged) emitDataChanged();
      return updated;
    },
    [accounts, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const count = txCountByAccount[id] ?? 0;
      if (count > 0) {
        throw new Error(
          tn(
            "This account has {count} transaction. Delete or reassign it before deleting the account.",
            "This account has {count} transactions. Delete or reassign them before deleting the account.",
            count,
          ),
        );
      }
      const target = accounts.find((a) => a.id === id);
      const ownerUid = target?._owner?.uid;
      const trashId = await accountStore.remove(id, ownerUid);
      await refresh();
      announceRemoval("Account deleted", [{ ownerUid, trashId }]);
    },
    [accounts, refresh, txCountByAccount],
  );

  /**
   * Line Perch's balance up with the bank's. Posts an adjustment for any
   * difference (neither income nor spending) and stamps the account as
   * reconciled. `actualBalance` is in the account's currency; negative means
   * owed, as with card balances.
   */
  const reconcile = useCallback(
    async (id: string, actualBalance: number) => {
      const target = accounts.find((a) => a.id === id);
      if (!target) throw new Error(t("Account not found."));
      const ownerUid = target._owner?.uid;
      const current = balances[id] ?? target.initialBalance;
      const diff = Math.round((actualBalance - current) * 100) / 100;
      if (Math.abs(diff) >= 0.005) {
        await transactionStore.add(
          {
            type: diff > 0 ? "income" : "expense",
            amount: Math.abs(diff),
            currency: target.currency,
            accountId: id,
            categoryId: "",
            // Left blank so the list shows a label in the reader's language.
            description: "",
            date: todayISODate(),
            adjustment: true,
          },
          ownerUid,
        );
      }
      await accountStore.update(
        id,
        {
          reconciledAt: new Date().toISOString(),
          reconciledBalance: actualBalance,
        },
        ownerUid,
      );
      emitDataChanged();
    },
    [accounts, balances],
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
    reconcile,
    refresh,
  };
}
