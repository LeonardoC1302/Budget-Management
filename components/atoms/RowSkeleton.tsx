import { cn } from "@/lib/utils/cn";

interface RowSkeletonProps {
  count?: number;
  bordered?: boolean;
  className?: string;
}

/**
 * A calm loading placeholder that mimics the shape of a list of entries.
 * Uses the shared .skeleton shimmer.
 */
export default function RowSkeleton({
  count = 4,
  bordered = true,
  className,
}: RowSkeletonProps) {
  const outer = bordered ? "surface" : "";
  return (
    <div
      className={cn(outer, "flex flex-col", className)}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-3 px-4 py-3.5 min-h-11",
            i > 0 && "border-t border-border",
          )}
        >
          <div className="w-8 h-3 skeleton" />
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div
              className="h-3 skeleton"
              style={{ width: `${45 + ((i * 17) % 40)}%` }}
            />
            <div
              className="h-2.5 skeleton opacity-70"
              style={{ width: `${30 + ((i * 11) % 25)}%` }}
            />
          </div>
          <div className="w-16 h-3.5 skeleton shrink-0" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
