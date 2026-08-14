"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import PerchMark from "@/components/atoms/PerchMark";
import ThemeToggle from "@/components/atoms/ThemeToggle";
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
 * Alcove route header. A nameplate (brand + tools) sits on a hairline wall;
 * below it, the route's kicker + title live in generous whitespace.
 * The theme toggle rides in the tools cluster on every route.
 */
export default function RouteMasthead({
  kicker,
  title,
  actions,
  className,
}: RouteMastheadProps) {
  return (
    <header className={cn("flex flex-col", className)}>
      <div className="nameplate">
        <Link
          href="/"
          aria-label="Home"
          className="nameplate-brand hover:opacity-80 transition-opacity"
          style={{ borderRadius: "var(--radius-control)" }}
        >
          <PerchMark size={18} />
          <span>Perch</span>
        </Link>
        <div className="nameplate-tools">
          {actions}
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="kicker">{kicker}</span>
        <h1 className="route-title">{title}</h1>
      </div>
    </header>
  );
}
