import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export default function Input({
  label,
  hint,
  id,
  className,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="label-sm">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "h-11 px-3.5 w-full bg-surface-2 text-fg placeholder:text-fg-subtle",
          "border border-border rounded-[10px]",
          "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
          "transition-colors",
          className,
        )}
        {...props}
      />
      {hint && <span className="text-xs text-fg-subtle">{hint}</span>}
    </div>
  );
}
