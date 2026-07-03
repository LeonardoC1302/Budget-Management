import { cn } from "@/lib/utils/cn";

interface ProgressBarProps {
  /** Value between 0 and 1. */
  value: number;
  tone?: "accent" | "income";
  className?: string;
  ariaLabel?: string;
}

export default function ProgressBar({
  value,
  tone = "accent",
  className,
  ariaLabel,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = Math.round(clamped * 100);
  const fillTone = tone === "income" ? "bg-income" : "bg-accent";

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={ariaLabel}
      className={cn(
        "w-full h-2 rounded-full bg-surface-2 overflow-hidden border border-border",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width]", fillTone)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
