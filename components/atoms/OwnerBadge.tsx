import { cn } from "@/lib/utils/cn";
import type { OwnerCtx } from "@/lib/types";

import { t } from "@/lib/i18n";
interface OwnerBadgeProps {
  owner?: OwnerCtx;
  className?: string;
}

// Tiny discreet marker that indicates an item came from a connected account.
// Renders only the icon — no text — so it slots into tight layouts without
// disturbing the row. Full context is available on hover via the tooltip.
export default function OwnerBadge({ owner, className }: OwnerBadgeProps) {
  if (!owner || owner.permission === "owner") return null;
  const label = owner.nickname || t("Shared");
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 text-fg-muted",
        className,
      )}
      title={t("Shared from {label}", { label })}
      aria-label={t("Shared from {label}", { label })}
    >
      <svg
        aria-hidden
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="7" cy="9" r="3" />
        <circle cx="17" cy="15" r="3" />
        <path d="M9.5 10.5l5 3" />
      </svg>
    </span>
  );
}
