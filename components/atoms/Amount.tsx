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
  sm: "text-[13px]",
  md: "text-[15px]",
  lg: "text-lg",
  xl: "courtyard-fig",
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
  const useSerif = size === "xl";

  return (
    <span
      className={cn(
        "tabular-nums whitespace-nowrap",
        useSerif ? "" : "figure",
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
