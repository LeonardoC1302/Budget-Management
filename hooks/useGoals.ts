"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { goalStore, transactionStore } from "@/lib/storage";
import { computeMonthlySavingsRate } from "@/lib/utils/goals";
import type {
  Goal,
  GoalContribution,
  NewGoal,
  NewGoalContribution,
  Transaction,
} from "@/lib/types";

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      goalStore.listGoals(),
      goalStore.listContributions(),
      transactionStore.list(),
    ]).then(([g, c, t]) => {
      setGoals(g);
      setContributions(c);
      setTransactions(t);
      setLoading(false);
    });
  }, []);

  const refreshGoals = useCallback(
    () =>
      Promise.all([goalStore.listGoals(), goalStore.listContributions()]).then(
        ([g, c]) => {
          setGoals(g);
          setContributions(c);
        },
      ),
    [],
  );

  const addGoal = useCallback(
    async (input: NewGoal) => {
      const created = await goalStore.addGoal(input);
      await refreshGoals();
      return created;
    },
    [refreshGoals],
  );

  const updateGoal = useCallback(
    async (id: string, patch: Partial<NewGoal>) => {
      const updated = await goalStore.updateGoal(id, patch);
      await refreshGoals();
      return updated;
    },
    [refreshGoals],
  );

  const removeGoal = useCallback(
    async (id: string) => {
      await goalStore.removeGoal(id);
      await refreshGoals();
    },
    [refreshGoals],
  );

  const addContribution = useCallback(
    async (input: NewGoalContribution) => {
      const created = await goalStore.addContribution(input);
      await refreshGoals();
      return created;
    },
    [refreshGoals],
  );

  const removeContribution = useCallback(
    async (id: string) => {
      await goalStore.removeContribution(id);
      await refreshGoals();
    },
    [refreshGoals],
  );

  const monthlyRate = useMemo(
    () => computeMonthlySavingsRate(transactions),
    [transactions],
  );

  const contributionsByGoal = useMemo(() => {
    const map: Record<string, GoalContribution[]> = {};
    for (const c of contributions) {
      (map[c.goalId] ??= []).push(c);
    }
    return map;
  }, [contributions]);

  return {
    goals,
    contributions,
    contributionsByGoal,
    monthlyRate,
    loading,
    addGoal,
    updateGoal,
    removeGoal,
    addContribution,
    removeContribution,
  };
}
