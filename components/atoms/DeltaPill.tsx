import { cn } from "@/lib/utils/cn";
import type { Delta } from "@/lib/utils/analytics";

interface DeltaPillProps {
  label: string;
  delta: Delta;
  /** Whether an "up" movement is favorable (e.g., income up = good). */
  goodWhen: "up" | "down";
  className?: string;
}

export default function DeltaPill({
  label,
  delta,
  goodWhen,
  className,
}: DeltaPillProps) {
  const { direction, percent } = delta;

  const arrow =
    direction === "up" ? "↑" : direction === "down" ? "↓" : direction === "flat" ? "→" : "–";
  const pct =
    direction === "up" || direction === "down"
      ? `${Math.round(percent * 100)}%`
      : direction === "flat"
        ? "0%"
        : "n/a";

  const tone =
    direction === "flat" || direction === "na"
      ? "text-fg-muted"
      : direction === goodWhen
        ? "text-income"
        : "text-expense";

  return (
    <div
      className={cn(
        "surface px-3 py-2.5 flex flex-col gap-0.5 min-w-0",
        className,
      )}
    >
      <span className="label-sm truncate">{label}</span>
      <span className={cn("text-sm font-medium tabular-nums", tone)}>
        {arrow} {pct}
      </span>
      <span className="text-[10px] text-fg-subtle">vs last month</span>
    </div>
  );
}
