"use client";

import { useCallback, useEffect, useState } from "react";
import type { BccrSnapshot } from "@/lib/services/bccrRates";

interface Cache {
  snapshot: BccrSnapshot | null;
  error: string | null;
  storedAt: number;
}

// Client-side cache shared across every consumer of the hook so opening the
// transfer sheet twice doesn't refetch. TTL is deliberately short (5 min) —
// the server route has its own 30-min cache, this is just to keep the UI
// snappy while the sheet is open.
const CLIENT_TTL_MS = 5 * 60 * 1000;
let cache: Cache = { snapshot: null, error: null, storedAt: 0 };
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

async function loadOnce(force: boolean): Promise<void> {
  if (
    !force &&
    cache.snapshot &&
    Date.now() - cache.storedAt < CLIENT_TTL_MS
  ) {
    return;
  }
  if (!force && inFlight) return inFlight;
  const request = (async () => {
    try {
      const res = await fetch(`/api/rates/bccr${force ? "?refresh=1" : ""}`);
      const data = (await res.json()) as
        | BccrSnapshot
        | { error: string };
      if (!res.ok || "error" in data) {
        const message =
          "error" in data && data.error
            ? data.error
            : `BCCR unavailable (${res.status})`;
        cache = { snapshot: null, error: message, storedAt: Date.now() };
      } else {
        cache = { snapshot: data, error: null, storedAt: Date.now() };
      }
    } catch (err) {
      cache = {
        snapshot: null,
        error: err instanceof Error ? err.message : "Network error",
        storedAt: Date.now(),
      };
    } finally {
      inFlight = null;
      emit();
    }
  })();
  inFlight = request;
  return request;
}

export function useBccrRates() {
  const [snapshot, setSnapshot] = useState<BccrSnapshot | null>(cache.snapshot);
  const [error, setError] = useState<string | null>(cache.error);
  const [loading, setLoading] = useState<boolean>(
    !cache.snapshot && !cache.error,
  );

  useEffect(() => {
    const sync = () => {
      setSnapshot(cache.snapshot);
      setError(cache.error);
      setLoading(false);
    };
    listeners.add(sync);
    if (!cache.snapshot && !cache.error) {
      void loadOnce(false);
    } else {
      sync();
    }
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await loadOnce(true);
  }, []);

  return { snapshot, error, loading, refresh };
}
