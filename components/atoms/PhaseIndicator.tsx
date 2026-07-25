import { cn } from "@/lib/utils/cn";

type Tone = "accent" | "income" | "expense" | "invest";

interface PhaseIndicatorProps {
  /** Progress value between 0 and 1. */
  progress: number;
  size?: number;
  tone?: Tone;
  /** Render the check glyph instead of "100" when fully reached. */
  reached?: boolean;
  className?: string;
  ariaLabel?: string;
}

const strokeVar: Record<Tone, string> = {
  accent: "var(--color-accent)",
  income: "var(--color-income)",
  expense: "var(--color-expense)",
  invest: "var(--color-invest)",
};

/**
 * A radial "moon phase" progress ring: a hairline circle representing
 * the goal, with an accent arc that fills clockwise from twelve o'clock
 * as progress grows. The center holds the percentage — or a check
 * glyph once the goal is reached — so the ring reads at a glance
 * without a nearby label.
 */
export default function PhaseIndicator({
  progress,
  size = 44,
  tone = "accent",
  reached,
  className,
  ariaLabel,
}: PhaseIndicatorProps) {
  const p = Math.max(0, Math.min(1, progress));
  const stroke = 3;
  const cx = size / 2;
  const r = size / 2 - stroke / 2 - 1;
  const c = 2 * Math.PI * r;
  const dash = `${(c * p).toFixed(2)} ${c.toFixed(2)}`;
  const centerLabel = reached || p >= 1 ? "\u2713" : `${Math.round(p * 100)}`;
  const centerFontSize = reached || p >= 1 ? size * 0.42 : size * 0.3;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={ariaLabel ?? `${Math.round(p * 100)}% of goal`}
      className={cn("shrink-0", className)}
    >
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={stroke}
      />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={strokeVar[tone]}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={dash}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: "stroke-dasharray 300ms cubic-bezier(0.2, 0.6, 0.2, 1)" }}
      />
      <text
        x={cx}
        y={cx + centerFontSize * 0.35}
        textAnchor="middle"
        fontSize={centerFontSize}
        fontWeight={600}
        fill="var(--color-fg)"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {centerLabel}
      </text>
    </svg>
  );
}
