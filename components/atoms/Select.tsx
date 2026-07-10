"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  className?: string;
  /**
   * Optional content rendered inside the popover, below the option list.
   * Receives `closeMenu` so callers can dismiss the dropdown after acting.
   */
  footer?: (closeMenu: () => void) => React.ReactNode;
}

export default function Select({
  label,
  options,
  value,
  onChange,
  disabled,
  placeholder = "Select…",
  id,
  name,
  className,
  footer,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const controlId = id ?? name;
  const selected = options.find((o) => o.value === value);

  const closeMenu = useCallback(() => setOpen(false), []);

  function toggle() {
    if (disabled) return;
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        const idx = options.findIndex((o) => o.value === value);
        setActiveIndex(idx >= 0 ? idx : 0);
      }
      return next;
    });
  }

  function commit(next: string) {
    onChange(next);
    setOpen(false);
    buttonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;

    function onDocMouseDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setActiveIndex(options.length - 1);
      } else if (event.key === "Enter" || event.key === " ") {
        if (activeIndex >= 0 && activeIndex < options.length) {
          event.preventDefault();
          commit(options[activeIndex].value);
        }
      }
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  });

  return (
    <div className="flex flex-col gap-1.5" ref={rootRef}>
      {label && (
        <label htmlFor={controlId} className="label-sm">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          id={controlId}
          type="button"
          disabled={disabled}
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "h-11 pl-3.5 pr-10 w-full bg-surface-2 text-fg text-left text-sm",
            "border border-border rounded-[10px] relative",
            "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
            "transition-colors cursor-pointer",
            "disabled:cursor-not-allowed disabled:opacity-60",
            className,
          )}
        >
          <span className={cn("truncate block", !selected && "text-fg-subtle")}>
            {selected?.label ?? placeholder}
          </span>
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted transition-transform",
              open && "rotate-180",
            )}
          >
            <polyline points="5 8 10 13 15 8" />
          </svg>
        </button>

        {open && (
          <div
            role="listbox"
            aria-labelledby={controlId}
            className="absolute z-40 top-full left-0 right-0 mt-1 surface p-1 shadow-xl max-h-64 overflow-y-auto"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const isActive = i === activeIndex;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => commit(opt.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-[8px] text-sm transition-colors flex items-center justify-between gap-3",
                    isActive
                      ? "bg-surface-2 text-fg"
                      : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                    isSelected && "text-fg",
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <span aria-hidden className="text-accent shrink-0">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}

            {footer && (
              <div className="border-t border-border mt-1 pt-1">
                {footer(closeMenu)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
