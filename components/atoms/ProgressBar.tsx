import { cn } from "@/lib/utils/cn";

interface ProgressBarProps {
  /** Value between 0 and 1. */
  value: number;
  tone?: "accent" | "income" | "expense";
  className?: string;
  ariaLabel?: string;
}

/**
 * Alcove progress rule — a thin hairline rail with a filled portion. The
 * fill sits above the rule so it visually walks along the wall, not inside
 * a bar. Same idea as the budget rule in the sandbox.
 */
export default function ProgressBar({
  value,
  tone = "accent",
  className,
  ariaLabel,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = Math.round(clamped * 100);
  const fillColor =
    tone === "income"
      ? "var(--color-income)"
      : tone === "expense"
        ? "var(--color-expense)"
        : "var(--color-celadon-strong)";

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={ariaLabel}
      className={cn(
        "relative w-full h-px bg-border",
        className,
      )}
    >
      <div
        className="absolute inset-y-0 left-0 transition-[width]"
        style={{
          width: `${pct}%`,
          height: tone === "expense" && clamped >= 1 ? 2 : 1,
          background: fillColor,
        }}
      />
    </div>
  );
}
