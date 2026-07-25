"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import PerchMark from "@/components/atoms/PerchMark";
import { cn } from "@/lib/utils/cn";

interface RouteMastheadProps {
  /** Small uppercase context word (e.g. "History", "Portfolio"). */
  kicker: string;
  /** Route title (e.g. "All transactions"). */
  title: string;
  /** Right-side slot for page-level actions (buttons, links). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Slim brand-anchor + title header used by every deep route.
 * Keeps the "Night Perch" identity present without stealing the
 * hero-Balance treatment that lives only on the home masthead.
 */
export default function RouteMasthead({
  kicker,
  title,
  actions,
  className,
}: RouteMastheadProps) {
  return (
    <header className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          aria-label="Home"
          className={cn(
            "inline-flex items-center gap-2 text-fg-subtle",
            "hover:text-fg transition-colors rounded-md",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
          )}
        >
          <PerchMark size={22} />
          <span className="text-sm font-medium tracking-tight">Perch</span>
        </Link>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="label-sm">{kicker}</span>
        <h1 className="heading-xl">{title}</h1>
      </div>
    </header>
  );
}
