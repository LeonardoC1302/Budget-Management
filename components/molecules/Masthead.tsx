"use client";

import { useSyncExternalStore } from "react";
import AccountMenu from "@/components/molecules/AccountMenu";
import Amount from "@/components/atoms/Amount";
import CurrencyToggle from "@/components/atoms/CurrencyToggle";
import PerchMark from "@/components/atoms/PerchMark";
import ThemeToggle from "@/components/atoms/ThemeToggle";
import { usePreferences } from "@/contexts/PreferencesContext";

function partOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function buildCaption(now: Date, currency: string): string {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(now);
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(now);
  return `${weekday} ${partOfDay(now.getHours())}, ${month} · all figures in ${currency}`;
}

const NO_SUB = () => () => {};
const SERVER_SNAPSHOT = () => "";

interface MastheadProps {
  balance: number;
}

/**
 * Home masthead. Perch identity anchored top-left (mark + wordmark), tools
 * anchored top-right, then a hairline wall and a single Alcove courtyard
 * carrying the month's balance with its warm skylight glow.
 */
export default function Masthead({ balance }: MastheadProps) {
  const { displayCurrency, convertUsd } = usePreferences();
  const caption = useSyncExternalStore(
    NO_SUB,
    () => buildCaption(new Date(), displayCurrency),
    SERVER_SNAPSHOT,
  );

  const displayBalance = convertUsd(balance);

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-fg">
          <PerchMark size={26} />
          <span className="text-lg font-semibold tracking-tight">Perch</span>
        </div>
        <div className="flex items-center gap-1">
          <CurrencyToggle />
          <ThemeToggle />
          <AccountMenu />
        </div>
      </div>

      <p
        className="text-xs text-fg-subtle -mt-1"
        suppressHydrationWarning
      >
        {caption || " "}
      </p>

      <div className="border-t border-border" aria-hidden />

      <div className="masthead-balance surface p-6 flex flex-col gap-2">
        <span className="label-sm">Balance of the month</span>
        <Amount
          value={displayBalance}
          tone={displayBalance >= 0 ? "income" : "expense"}
          size="xl"
          currency={displayCurrency}
          compact
        />
      </div>
    </header>
  );
}
