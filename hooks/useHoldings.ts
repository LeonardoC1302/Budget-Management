"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { subscribeDataChanged } from "@/lib/events/dataChanged";
import { holdingStore, transactionStore } from "@/lib/storage";
import { computePositions } from "@/lib/utils/holdings";
import type {
  Holding,
  HoldingValuation,
  NewHolding,
  NewHoldingValuation,
  Transaction,
} from "@/lib/types";

export function useHoldings() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [valuations, setValuations] = useState<HoldingValuation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [h, v, t] = await Promise.all([
      holdingStore.listHoldings(),
      holdingStore.listValuations(),
      transactionStore.list(),
    ]);
    setHoldings(h);
    setValuations(v);
    setTransactions(t);
  }, []);

  useEffect(() => {
    Promise.all([
      holdingStore.listHoldings(),
      holdingStore.listValuations(),
      transactionStore.list(),
    ]).then(([h, v, t]) => {
      setHoldings(h);
      setValuations(v);
      setTransactions(t);
      setLoading(false);
    });
  }, []);

  useEffect(() => subscribeDataChanged(() => void refresh()), [refresh]);

  const addHolding = useCallback(
    async (input: NewHolding) => {
      const created = await holdingStore.addHolding(input);
      await refresh();
      return created;
    },
    [refresh],
  );

  const updateHolding = useCallback(
    async (id: string, patch: Partial<NewHolding>) => {
      const target = holdings.find((h) => h.id === id);
      const updated = await holdingStore.updateHolding(
        id,
        patch,
        target?._owner?.uid,
      );
      await refresh();
      return updated;
    },
    [holdings, refresh],
  );

  const removeHolding = useCallback(
    async (id: string) => {
      const target = holdings.find((h) => h.id === id);
      await holdingStore.removeHolding(id, target?._owner?.uid);
      await refresh();
    },
    [holdings, refresh],
  );

  const addValuation = useCallback(
    async (input: NewHoldingValuation) => {
      const holding = holdings.find((h) => h.id === input.holdingId);
      const created = await holdingStore.addValuation(
        input,
        holding?._owner?.uid,
      );
      await refresh();
      return created;
    },
    [holdings, refresh],
  );

  const updateValuation = useCallback(
    async (id: string, patch: Partial<NewHoldingValuation>) => {
      const target = valuations.find((v) => v.id === id);
      const updated = await holdingStore.updateValuation(
        id,
        patch,
        target?._owner?.uid,
      );
      await refresh();
      return updated;
    },
    [valuations, refresh],
  );

  const removeValuation = useCallback(
    async (id: string) => {
      const target = valuations.find((v) => v.id === id);
      await holdingStore.removeValuation(id, target?._owner?.uid);
      await refresh();
    },
    [valuations, refresh],
  );

  const investments = useMemo(
    () => transactions.filter((t) => t.type === "investment"),
    [transactions],
  );

  const byId = useMemo(() => {
    const map: Record<string, Holding | undefined> = {};
    for (const h of holdings) map[h.id] = h;
    return map;
  }, [holdings]);

  const positionsById = useMemo(
    () => computePositions(investments, holdings),
    [investments, holdings],
  );

  const valuationsByHolding = useMemo(() => {
    const map: Record<string, HoldingValuation[]> = {};
    for (const v of valuations) {
      (map[v.holdingId] ??= []).push(v);
    }
    for (const list of Object.values(map)) {
      list.sort((a, b) => b.asOfDate.localeCompare(a.asOfDate));
    }
    return map;
  }, [valuations]);

  const unassignedInvestments = useMemo(
    () => investments.filter((t) => !t.holdingId),
    [investments],
  );

  return {
    holdings,
    byId,
    valuations,
    valuationsByHolding,
    investments,
    unassignedInvestments,
    positionsById,
    loading,
    addHolding,
    updateHolding,
    removeHolding,
    addValuation,
    updateValuation,
    removeValuation,
    refresh,
  };
}
