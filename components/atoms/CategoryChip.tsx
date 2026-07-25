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
  sm: "w-8 h-8 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-14 h-14 text-base",
};

const toneClass: Record<ChipTone, string> = {
  neutral: "bg-surface-2 border-border text-fg",
  accent: "bg-accent/10 border-accent/30 text-accent",
  income: "bg-income-soft border-income/30 text-income",
  expense: "bg-expense-soft border-expense/30 text-expense",
  invest: "bg-invest-soft border-invest/30 text-invest",
};

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts.map((s) => s[0]?.toUpperCase() ?? "").join("");
}

/**
 * A tinted round well showing 1–2 initial letters of a category or
 * label. Gives lists a stronger visual identity without needing
 * user-authored icons or colors.
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
        "shrink-0 rounded-full border flex items-center justify-center",
        "font-semibold tracking-tight select-none",
        sizeClass[size],
        toneClass[tone],
        className,
      )}
    >
      {initialsOf(name)}
    </div>
  );
}
