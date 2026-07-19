import { cn } from "@/lib/utils/cn";

type Variant = "up" | "down" | "transfer" | "invest";

interface TransactionTypeIconProps {
  variant: Variant;
  className?: string;
}

export default function TransactionTypeIcon({
  variant,
  className,
}: TransactionTypeIconProps) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: cn("block", className),
  };

  if (variant === "up") {
    return (
      <svg {...common}>
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    );
  }
  if (variant === "down") {
    return (
      <svg {...common}>
        <path d="M12 5v14" />
        <path d="M19 12l-7 7-7-7" />
      </svg>
    );
  }
  if (variant === "transfer") {
    return (
      <svg {...common}>
        <path d="M16 3l4 4-4 4" />
        <path d="M20 7H4" />
        <path d="M8 13l-4 4 4 4" />
        <path d="M4 17h16" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="currentColor" stroke="none">
      <path d="M12 4l8 14H4l8-14z" />
    </svg>
  );
}
