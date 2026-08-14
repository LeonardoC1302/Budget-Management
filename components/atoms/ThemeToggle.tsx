"use client";

import { useMode } from "@/components/atoms/ThemeProvider";
import { cn } from "@/lib/utils/cn";

interface ThemeToggleProps {
  className?: string;
  ariaLabel?: string;
}

/**
 * A small sun/moon toggle. Inherits `color` from its host so it takes on the
 * current text tone by default. Sized for a thumb (36px min tap target).
 */
export default function ThemeToggle({ className, ariaLabel }: ThemeToggleProps) {
  const { mode, toggle } = useMode();
  const isDark = mode === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center justify-center w-9 h-9 rounded-md text-fg-muted",
        "hover:text-fg hover:bg-surface-2 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        className,
      )}
      aria-label={ariaLabel ?? `Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      title={ariaLabel ?? `Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {isDark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="3" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="21" />
            <line x1="3" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="21" y2="12" />
            <line x1="5.6" y1="5.6" x2="7" y2="7" />
            <line x1="17" y1="17" x2="18.4" y2="18.4" />
            <line x1="5.6" y1="18.4" x2="7" y2="17" />
            <line x1="17" y1="7" x2="18.4" y2="5.6" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        )}
      </svg>
    </button>
  );
}
