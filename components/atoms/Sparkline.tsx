import { cn } from "@/lib/utils/cn";

interface SparklineProps {
  /** Series of values ordered oldest → newest. */
  values: number[];
  className?: string;
  /** Preferred pixel width — height is auto (2:5 aspect). */
  width?: number;
  height?: number;
  /** Line tone: "up" (income), "down" (expense), or "neutral". Auto by default. */
  tone?: "up" | "down" | "neutral" | "auto";
}

export default function Sparkline({
  values,
  className,
  width = 60,
  height = 20,
  tone = "auto",
}: SparklineProps) {
  if (values.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cn("shrink-0", className)}
        style={{ width, height }}
        aria-hidden
      />
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const step = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const resolvedTone =
    tone === "auto"
      ? values[values.length - 1] >= values[0]
        ? "up"
        : "down"
      : tone;

  const strokeVar =
    resolvedTone === "up"
      ? "var(--color-income)"
      : resolvedTone === "down"
        ? "var(--color-expense)"
        : "var(--color-fg-muted)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0", className)}
      style={{ width, height }}
      aria-hidden
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={strokeVar}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
