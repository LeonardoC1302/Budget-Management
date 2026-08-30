"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { updateDisplayCurrency } from "@/lib/firebase/seed";
import { getRate } from "@/lib/services/exchangeRates";
import { BASE_CURRENCY } from "@/lib/utils/currencies";

interface PreferencesContextValue {
  displayCurrency: string;
  setDisplayCurrency: (currency: string) => Promise<void>;
  // USD → displayCurrency, or 1 while loading / if the fetch fails.
  usdToDisplayRate: number;
  // Convert a USD-normalized aggregate into the current display currency.
  convertUsd: (usdAmount: number) => number;
}

const Ctx = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [displayCurrency, setDisplayCurrencyState] =
    useState<string>(BASE_CURRENCY);
  const [usdToDisplayRate, setUsdToDisplayRate] = useState<number>(1);

  useEffect(() => {
    if (!user) {
      setDisplayCurrencyState(BASE_CURRENCY);
      return;
    }
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const pref = snap.data()?.preferences?.displayCurrency;
      setDisplayCurrencyState(
        typeof pref === "string" && pref ? pref : BASE_CURRENCY,
      );
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    if (displayCurrency === BASE_CURRENCY) {
      setUsdToDisplayRate(1);
      return;
    }
    getRate(BASE_CURRENCY, displayCurrency)
      .then((r) => {
        if (!cancelled) setUsdToDisplayRate(r);
      })
      .catch((err) => {
        console.warn("Failed to fetch USD→display rate", err);
        if (!cancelled) setUsdToDisplayRate(1);
      });
    return () => {
      cancelled = true;
    };
  }, [displayCurrency]);

  const setDisplayCurrency = useCallback(
    async (currency: string) => {
      if (!user) return;
      await updateDisplayCurrency(user.uid, currency);
    },
    [user],
  );

  const convertUsd = useCallback(
    (usdAmount: number) => usdAmount * usdToDisplayRate,
    [usdToDisplayRate],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      displayCurrency,
      setDisplayCurrency,
      usdToDisplayRate,
      convertUsd,
    }),
    [displayCurrency, setDisplayCurrency, usdToDisplayRate, convertUsd],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("usePreferences must be used inside <PreferencesProvider>");
  return ctx;
}
