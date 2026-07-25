import { cn } from "@/lib/utils/cn";

interface RowSkeletonProps {
  /** Number of rows to render. Defaults to 4. */
  count?: number;
  /** Wrap in the `.surface` grammar. Set false when parent already provides it. */
  bordered?: boolean;
  className?: string;
}

/**
 * A calm loading placeholder that mimics the shape of a transaction list
 * or recurring list. Keeps `.surface` ambient depth from the redesigned home,
 * with softly pulsing rows in place of the "Loading…" text stub.
 */
export default function RowSkeleton({
  count = 4,
  bordered = true,
  className,
}: RowSkeletonProps) {
  return (
    <div
      className={cn(
        bordered && "surface px-4",
        !bordered && "px-0",
        "divide-y divide-border",
        className,
      )}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <div className="w-10 h-10 shrink-0 rounded-full bg-surface-2 animate-pulse" />
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div
              className="h-3 rounded bg-surface-2 animate-pulse"
              style={{ width: `${45 + ((i * 17) % 40)}%` }}
            />
            <div
              className="h-2.5 rounded bg-surface-2 animate-pulse opacity-70"
              style={{ width: `${30 + ((i * 11) % 25)}%` }}
            />
          </div>
          <div className="w-16 h-3.5 rounded bg-surface-2 animate-pulse shrink-0" />
        </div>
      ))}
      <span className="sr-only">Loading&hellip;</span>
    </div>
  );
}
