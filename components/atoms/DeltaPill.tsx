import { cn } from "@/lib/utils/cn";
import type { Delta } from "@/lib/utils/analytics";

interface DeltaPillProps {
  label: string;
  delta: Delta;
  /** Whether an "up" movement is favorable (e.g., income up = good). */
  goodWhen: "up" | "down";
  /** Optional soft rider shown when the movement is unfavorable. */
  reassuranceWhenBad?: string;
  className?: string;
}

/**
 * Alcove delta pill — the label, an arrow + percentage in a semantic tone,
 * and a small caption. Sits inside a `.rooms-h` container so the three-up
 * grouping on the dashboard reads as a single joined surface.
 */
export default function DeltaPill({
  label,
  delta,
  goodWhen,
  reassuranceWhenBad,
  className,
}: DeltaPillProps) {
  const { direction, percent } = delta;

  const arrow =
    direction === "up"
      ? "↑"
      : direction === "down"
        ? "↓"
        : direction === "flat"
          ? "—"
          : "–";
  const pct =
    direction === "up" || direction === "down"
      ? `${Math.round(percent * 100)}%`
      : direction === "flat"
        ? "0%"
        : "n/a";

  const isBad =
    (direction === "up" || direction === "down") && direction !== goodWhen;
  const isGood =
    (direction === "up" || direction === "down") && direction === goodWhen;

  const arrowColor = isGood
    ? "text-income"
    : isBad
      ? "text-expense"
      : "text-fg-muted";

  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-2 p-4 min-h-24",
        className,
      )}
    >
      <span className="kicker">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className={cn("font-serif text-2xl leading-none", arrowColor)}>
          {arrow}
        </span>
        <span
          className={cn(
            "font-mono text-sm tabular-nums",
            arrowColor,
          )}
        >
          {pct}
        </span>
      </div>
      <span className="text-[10px] text-fg-subtle leading-tight uppercase tracking-[0.14em]">
        vs last month
      </span>
      {isBad && reassuranceWhenBad && (
        <span className="lede text-[11px] leading-snug">
          {reassuranceWhenBad}
        </span>
      )}
    </div>
  );
}
