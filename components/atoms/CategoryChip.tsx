import { cn } from "@/lib/utils/cn";

type ChipTone = "neutral" | "accent" | "income" | "expense" | "invest";
type ChipSize = "sm" | "md" | "lg";

interface CategoryChipProps {
  name: string;
  tone?: ChipTone;
  size?: ChipSize;
  className?: string;
}

const sizeClass: Record<ChipSize, string> = {
  sm: "w-8 h-8 text-[10px]",
  md: "w-11 h-11 text-[12px]",
  lg: "w-14 h-14 text-[13px]",
};

const toneClass: Record<ChipTone, string> = {
  neutral: "bg-surface-2 text-fg-muted",
  accent: "bg-surface-2 text-accent",
  income: "text-income",
  expense: "text-expense",
  invest: "text-invest",
};

const toneBg: Record<ChipTone, string> = {
  neutral: "",
  accent: "",
  income: "var(--color-income-soft)",
  expense: "var(--color-expense-soft)",
  invest: "var(--color-invest-soft)",
};

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.map((s) => s[0]?.toUpperCase() ?? "").join("");
}

/**
 * Round well with 1–2 category initials. Alcove keeps the well subtle —
 * a soft-tinted circle, no bold border.
 */
export default function CategoryChip({
  name,
  tone = "neutral",
  size = "md",
  className,
}: CategoryChipProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "shrink-0 rounded-full border border-border flex items-center justify-center",
        "font-medium tracking-wider select-none uppercase",
        sizeClass[size],
        toneClass[tone],
        className,
      )}
      style={{
        fontFamily: "var(--font-sans)",
        letterSpacing: "0.12em",
        background: toneBg[tone] || undefined,
      }}
    >
      {initialsOf(name)}
    </div>
  );
}
