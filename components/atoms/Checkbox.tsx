"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  className?: string;
};

/**
 * Alcove checkbox. The native input drives semantics and focus, positioned
 * absolutely over the visual so the whole area is clickable and taps
 * register natively. The `.alcove-check` visual sits behind it and reacts
 * to `input:checked` via `.alcove-check-wrap:has(...)` in globals.css.
 */
export default function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <span className={cn("alcove-check-wrap relative inline-flex shrink-0", className)}>
      <input
        {...props}
        type="checkbox"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
      />
      <span aria-hidden className="alcove-check">
        <svg
          viewBox="0 0 16 16"
          className="alcove-check-tick"
          aria-hidden
        >
          <polyline
            points="3.5 8 6.5 11 12.5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </span>
  );
}
