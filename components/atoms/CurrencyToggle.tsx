"use client";

import { usePreferences } from "@/contexts/PreferencesContext";
import { cn } from "@/lib/utils/cn";

interface CurrencyToggleProps {
  className?: string;
}

/**
 * Small pill in the Masthead that flips the display currency between the two
 * supported codes (USD ↔ CRC). Clicking cycles; the label always reads the
 * currently active code so users know what totals are being shown in.
 */
export default function CurrencyToggle({ className }: CurrencyToggleProps) {
  const { displayCurrency, setDisplayCurrency } = usePreferences();
  const next = displayCurrency === "USD" ? "CRC" : "USD";
  return (
    <button
      type="button"
      onClick={() => {
        void setDisplayCurrency(next);
      }}
      className={cn(
        "inline-flex items-center justify-center h-9 min-w-9 px-2 rounded-md text-fg-muted text-xs font-medium tracking-wide",
        "hover:text-fg hover:bg-surface-2 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        className,
      )}
      aria-label={`Switch display currency to ${next}`}
      title={`Switch display currency to ${next}`}
    >
      {displayCurrency}
    </button>
  );
}
