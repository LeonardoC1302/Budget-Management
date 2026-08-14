"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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

interface MenuRect {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "below" | "above";
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
  const [rect, setRect] = useState<MenuRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const controlId = id ?? name;
  const selected = options.find((o) => o.value === value);

  const closeMenu = useCallback(() => setOpen(false), []);

  const commit = useCallback(
    (next: string) => {
      onChange(next);
      setOpen(false);
      buttonRef.current?.focus();
    },
    [onChange],
  );

  const positionMenu = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const btnRect = button.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const margin = 16;
    const gap = 4;
    const desired = 320;
    const spaceBelow = viewportH - btnRect.bottom - gap - margin;
    const spaceAbove = btnRect.top - gap - margin;
    const placeAbove = spaceBelow < desired && spaceAbove > spaceBelow;
    const maxHeight = Math.min(desired, Math.max(160, placeAbove ? spaceAbove : spaceBelow));
    setRect({
      top: placeAbove ? btnRect.top - gap : btnRect.bottom + gap,
      left: btnRect.left,
      width: btnRect.width,
      maxHeight,
      placement: placeAbove ? "above" : "below",
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    positionMenu();
  }, [open, positionMenu]);

  useEffect(() => {
    if (!open) return;
    function onWindowChange() {
      positionMenu();
    }
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("scroll", onWindowChange, true);
    return () => {
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("scroll", onWindowChange, true);
    };
  }, [open, positionMenu]);

  useEffect(() => {
    if (!open) return;

    function onDocMouseDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
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
  }, [open, options, activeIndex, commit]);

  useEffect(() => {
    const list = listRef.current;
    if (!open || !list || activeIndex < 0) return;
    const item = list.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

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

  const menu =
    open && rect
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[60] surface p-1 flex flex-col"
            style={{
              top: rect.placement === "above" ? undefined : rect.top,
              bottom:
                rect.placement === "above"
                  ? window.innerHeight - rect.top
                  : undefined,
              left: rect.left,
              width: rect.width,
              maxHeight: rect.maxHeight,
            }}
          >
            <div
              ref={listRef}
              role="listbox"
              aria-labelledby={controlId}
              className="flex-1 min-h-0 overflow-y-auto scrollbar-thin"
            >
              {options.map((opt, i) => {
                const isSelected = opt.value === value;
                const isActive = i === activeIndex;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    data-index={i}
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => commit(opt.value)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between gap-3",
                      isActive
                        ? "bg-surface-2 text-fg"
                        : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                      isSelected && "text-fg",
                    )}
                    style={{ borderRadius: "var(--radius-control)" }}
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
            </div>

            {footer && (
              <div className="border-t border-border mt-1 pt-1 shrink-0">
                {footer(closeMenu)}
              </div>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="field">
      {label && (
        <label htmlFor={controlId} className="field-label">
          {label}
        </label>
      )}

      <button
        ref={buttonRef}
        id={controlId}
        type="button"
        disabled={disabled}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "input text-left flex items-center relative pr-10",
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
          strokeWidth="1.5"
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

      {menu}
    </div>
  );
}
