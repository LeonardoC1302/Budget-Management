import { cn } from "@/lib/utils/cn";

type Tone = "income" | "expense" | "neutral";

interface AmountProps {
  value: number;
  tone?: Tone;
  size?: "sm" | "md" | "lg" | "xl";
  showSign?: boolean;
  currency?: string;
  className?: string;
}

const sizeClass = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-3xl font-semibold tracking-tight",
};

const toneClass: Record<Tone, string> = {
  income: "text-income",
  expense: "text-expense",
  neutral: "text-fg",
};

export default function Amount({
  value,
  tone = "neutral",
  size = "md",
  showSign = false,
  currency = "USD",
  className,
}: AmountProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  const sign = showSign ? (tone === "expense" ? "−" : tone === "income" ? "+" : "") : "";

  return (
    <span
      className={cn(
        "tabular-nums whitespace-nowrap",
        sizeClass[size],
        toneClass[tone],
        className,
      )}
    >
      {sign}
      {formatted}
    </span>
  );
}
