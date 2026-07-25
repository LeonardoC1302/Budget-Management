import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  /** Renders the action as a `<Link>`. Ignored if `actionOnClick` is set. */
  actionHref?: string;
  /** Renders the action as a `<button>`. Takes precedence over `actionHref`. */
  actionOnClick?: () => void;
  className?: string;
}

/**
 * A quiet, structured empty state used across deep routes.
 * Renders a title, optional description, and an optional action
 * (either a Link or a button-styled action) using the shared
 * `.surface` grammar.
 */
export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
  className,
}: EmptyStateProps) {
  const actionClass = cn(
    "mt-2 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[10px]",
    "bg-surface-2 border border-border text-sm font-medium text-fg",
    "hover:border-border-strong transition-colors",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
  );

  const actionNode =
    actionLabel && actionOnClick ? (
      <button type="button" onClick={actionOnClick} className={actionClass}>
        {actionLabel}
        <span aria-hidden>&rarr;</span>
      </button>
    ) : actionLabel && actionHref ? (
      <Link href={actionHref} className={actionClass}>
        {actionLabel}
        <span aria-hidden>&rarr;</span>
      </Link>
    ) : null;

  return (
    <div
      className={cn(
        "surface p-8 flex flex-col items-center text-center gap-2",
        className,
      )}
    >
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && (
        <p className="text-xs text-fg-subtle max-w-xs">{description}</p>
      )}
      {actionNode}
    </div>
  );
}
