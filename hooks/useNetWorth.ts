"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeDataChanged } from "@/lib/events/dataChanged";
import { getRate } from "@/lib/services/exchangeRates";
import type { HistoryPoint, HistoryResult } from "@/lib/services/marketData";
import { accountStore, holdingStore, transactionStore } from "@/lib/storage";
import {
  computeNetWorthSeries,
  lastMonthKeys,
  type NetWorthInputs,
  type NetWorthPoint,
} from "@/lib/utils/netWorth";

export const NET_WORTH_MONTHS = 12;

async function loadInputs(): Promise<NetWorthInputs> {
  const [accounts, transactions, holdings, valuations] = await Promise.all([
    accountStore.list(),
    transactionStore.list(),
    holdingStore.listHoldings(),
    holdingStore.listValuations(),
  ]);

  const currencies = [...new Set(accounts.map((a) => a.currency))].filter(
    (c) => c !== "USD",
  );
  const rates = await Promise.all(
    currencies.map((c) =>
      getRate("USD", c).then(
        (r) => [c, r] as const,
        () => null,
      ),
    ),
  );

  // One year of closes per ticker. Failures (no API key, offline, rate
  // limit) leave the holding at cost basis, marked as estimated.
  const symbols = [
    ...new Set(
      holdings.filter((h) => h.kind === "market" && h.symbol).map((h) => h.symbol!),
    ),
  ];
  const histories = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const res = await fetch(
          `/api/market/history?symbol=${encodeURIComponent(symbol)}&range=1Y`,
        );
        if (!res.ok) return null;
        const data = (await res.json()) as HistoryResult;
        return [symbol, data.points ?? []] as const;
      } catch {
        return null;
      }
    }),
  );

  return {
    accounts,
    transactions,
    holdings,
    valuations,
    usdRates: Object.fromEntries(rates.filter((r) => r !== null)),
    priceHistory: Object.fromEntries(
      histories.filter((h): h is readonly [string, HistoryPoint[]] => h !== null),
    ),
  };
}

export function useNetWorth(months = NET_WORTH_MONTHS) {
  const [inputs, setInputs] = useState<NetWorthInputs | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      loadInputs().then(
        (next) => {
          if (!cancelled) setInputs(next);
        },
        (err) => console.error("Net worth failed to load", err),
      );
    load();
    const unsubscribe = subscribeDataChanged(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const series = useMemo<NetWorthPoint[]>(
    () =>
      inputs ? computeNetWorthSeries(lastMonthKeys(months), inputs) : [],
    [inputs, months],
  );

  return { series, loading: inputs === null };
}
