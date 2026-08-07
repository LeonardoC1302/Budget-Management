"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { QuoteResult } from "@/lib/services/marketData";

const REFRESH_MS = 5 * 60 * 1000;

interface QuotesResponse {
  quotes?: QuoteResult[];
  error?: string;
}

export type MarketQuotesStatus = "idle" | "loading" | "ready" | "unavailable" | "error";

/** Batched, visibility-aware live quotes for a set of symbols. */
export function useMarketQuotes(symbols: string[]) {
  const key = useMemo(
    () =>
      Array.from(new Set(symbols.map((s) => s.trim()).filter(Boolean)))
        .sort()
        .join(","),
    [symbols],
  );

  const [quotes, setQuotes] = useState<Record<string, QuoteResult>>({});
  const [status, setStatus] = useState<MarketQuotesStatus>("idle");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!key) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStatus((s) => (s === "ready" ? "ready" : "loading"));
    try {
      const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(key)}`, {
        signal: ctrl.signal,
      });
      if (res.status === 503) {
        setStatus("unavailable");
        return;
      }
      const data = (await res.json()) as QuotesResponse;
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const map: Record<string, QuoteResult> = {};
      for (const q of data.quotes ?? []) map[q.symbol] = q;
      setQuotes(map);
      setStatus("ready");
      setLastUpdated(Date.now());
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setStatus("error");
    }
  }, [key]);

  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    fetch(`/api/market/quote?symbols=${encodeURIComponent(key)}`, {
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (res.status === 503) {
          setStatus("unavailable");
          return;
        }
        const data = (await res.json()) as QuotesResponse;
        if (!res.ok) {
          setStatus("error");
          return;
        }
        const map: Record<string, QuoteResult> = {};
        for (const q of data.quotes ?? []) map[q.symbol] = q;
        setQuotes(map);
        setStatus("ready");
        setLastUpdated(Date.now());
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        setStatus("error");
      });
    return () => ctrl.abort();
  }, [key]);

  useEffect(() => {
    if (!key) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (document.visibilityState === "visible") void load();
      }, REFRESH_MS);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void load();
        start();
      } else {
        stop();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    if (document.visibilityState === "visible") start();
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      stop();
    };
  }, [key, load]);

  const exposedQuotes = key ? quotes : {};
  const exposedStatus: MarketQuotesStatus = key ? status : "idle";

  return {
    quotes: exposedQuotes,
    status: exposedStatus,
    lastUpdated,
    refresh: load,
  };
}
