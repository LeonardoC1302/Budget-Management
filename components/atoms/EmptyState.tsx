import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  className?: string;
}

/**
 * Quiet empty state — italic serif title, muted body, optional single action.
 */
export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
  className,
}: EmptyStateProps) {
  const actionClass = "mt-3 btn btn-secondary btn-sm";
  const actionNode =
    actionLabel && actionOnClick ? (
      <button type="button" onClick={actionOnClick} className={actionClass}>
        {actionLabel}
        <span aria-hidden>→</span>
      </button>
    ) : actionLabel && actionHref ? (
      <Link href={actionHref} className={actionClass}>
        {actionLabel}
        <span aria-hidden>→</span>
      </Link>
    ) : null;

  return (
    <div className={cn("empty", className)}>
      <p className="empty-title">{title}</p>
      {description && <p className="empty-body">{description}</p>}
      {actionNode}
    </div>
  );
}
