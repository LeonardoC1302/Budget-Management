"use client";

import { useCallback, useEffect, useState } from "react";
import type { HistoryResult, MarketRange } from "@/lib/services/marketData";

export type MarketHistoryStatus =
  | "idle"
  | "loading"
  | "ready"
  | "unavailable"
  | "error";

interface State {
  data: HistoryResult | null;
  status: MarketHistoryStatus;
  error: string | null;
}

const EMPTY: State = { data: null, status: "idle", error: null };

export function useMarketHistory(symbol: string | null, range: MarketRange) {
  const [state, setState] = useState<State>(EMPTY);

  const load = useCallback(async () => {
    if (!symbol) return;
    setState((s) => ({ ...s, status: "loading" }));
    try {
      const res = await fetch(
        `/api/market/history?symbol=${encodeURIComponent(symbol)}&range=${range}`,
      );
      if (res.status === 503) {
        setState({ data: null, status: "unavailable", error: null });
        return;
      }
      const data = (await res.json()) as HistoryResult & { error?: string };
      if (!res.ok) {
        setState({ data: null, status: "error", error: data.error ?? "error" });
        return;
      }
      setState({ data, status: "ready", error: null });
    } catch (err) {
      setState({
        data: null,
        status: "error",
        error: err instanceof Error ? err.message : "error",
      });
    }
  }, [symbol, range]);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    fetch(`/api/market/history?symbol=${encodeURIComponent(symbol)}&range=${range}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 503) {
          setState({ data: null, status: "unavailable", error: null });
          return;
        }
        const data = (await res.json()) as HistoryResult & { error?: string };
        if (!res.ok) {
          setState({ data: null, status: "error", error: data.error ?? "error" });
          return;
        }
        setState({ data, status: "ready", error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            data: null,
            status: "error",
            error: err instanceof Error ? err.message : "error",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, range]);

  const exposed = symbol ? state : EMPTY;

  return { ...exposed, refresh: load };
}
