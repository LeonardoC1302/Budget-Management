"use client";

import { useSyncExternalStore } from "react";
import PerchMark from "@/components/atoms/PerchMark";
import AccountMenu from "@/components/molecules/AccountMenu";
import Amount from "@/components/atoms/Amount";

function partOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function buildCaption(now: Date): string {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(now);
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(now);
  return `${weekday} ${partOfDay(now.getHours())}, ${month} \u00B7 all figures in USD`;
}

// Subscribing is a no-op — the caption is stable enough for a single mount
// read. Snapshot returns an empty string on the server (no clock) and the
// composed phrase on the client, keeping hydration honest without pulling
// state through useEffect.
const NO_SUB = () => () => {};
const CLIENT_SNAPSHOT = () => buildCaption(new Date());
const SERVER_SNAPSHOT = () => "";

interface MastheadProps {
  balance: number;
}

export default function Masthead({ balance }: MastheadProps) {
  const caption = useSyncExternalStore(
    NO_SUB,
    CLIENT_SNAPSHOT,
    SERVER_SNAPSHOT,
  );

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-fg">
          <PerchMark size={26} />
          <span className="text-lg font-semibold tracking-tight">Perch</span>
        </div>
        <AccountMenu />
      </div>

      <p
        className="text-xs text-fg-subtle -mt-1"
        suppressHydrationWarning
      >
        {caption || "\u00A0"}
      </p>

      <div
        className="border-t border-border border-dashed opacity-80"
        aria-hidden
      />

      <div className="masthead-balance surface p-6 flex flex-col gap-2">
        <span className="label-sm">Balance</span>
        <Amount
          value={balance}
          tone={balance >= 0 ? "income" : "expense"}
          size="xl"
        />
        <span className="roost-line" aria-hidden />
      </div>
    </header>
  );
}
