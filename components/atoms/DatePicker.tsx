"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

interface MenuRect {
  centered: boolean;
  top: number;
  left: number;
  maxHeight: number;
  placement: "below" | "above";
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseISO(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const d = Number(match[3]);
  if (m < 0 || m > 11 || d < 1 || d > 31) return null;
  return { y, m, d };
}

function formatDisplay(iso: string): string {
  const parts = parseISO(iso);
  if (!parts) return iso;
  return `${MONTH_NAMES[parts.m].slice(0, 3)} ${parts.d}, ${parts.y}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

function firstWeekday(y: number, m: number): number {
  return new Date(y, m, 1).getDay();
}

function todayISO(): string {
  const now = new Date();
  return toISO(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function DatePicker({
  label,
  value,
  onChange,
  id,
  name,
  required,
  disabled,
  placeholder = "Select date…",
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<MenuRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const controlId = id ?? name;

  const initialView = useMemo(() => {
    const parts = parseISO(value) ?? parseISO(todayISO());
    return parts ?? { y: new Date().getFullYear(), m: new Date().getMonth(), d: 1 };
  }, [value]);
  const [viewY, setViewY] = useState(initialView.y);
  const [viewM, setViewM] = useState(initialView.m);

  const commit = useCallback(
    (iso: string) => {
      onChange(iso);
      setOpen(false);
      buttonRef.current?.focus();
    },
    [onChange],
  );

  const positionMenu = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const margin = 16;
    const btnRect = button.getBoundingClientRect();
    const gap = 4;
    const desired = 360;

    let next: MenuRect;
    if (viewportW < 640) {
      next = {
        centered: true,
        top: 0,
        left: 0,
        maxHeight: viewportH - margin * 2,
        placement: "below",
      };
    } else {
      const spaceBelow = viewportH - btnRect.bottom - gap - margin;
      const spaceAbove = btnRect.top - gap - margin;
      const placeAbove = spaceBelow < desired && spaceAbove > spaceBelow;
      const maxHeight = Math.min(desired, Math.max(200, placeAbove ? spaceAbove : spaceBelow));
      next = {
        centered: false,
        top: placeAbove ? btnRect.top - gap : btnRect.bottom + gap,
        left: btnRect.left,
        maxHeight,
        placement: placeAbove ? "above" : "below",
      };
    }
    setRect(next);
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
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (disabled) return;
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        const parts = parseISO(value);
        if (parts) {
          setViewY(parts.y);
          setViewM(parts.m);
        }
      }
      return next;
    });
  }

  function prevMonth() {
    setViewM((m) => {
      if (m === 0) {
        setViewY((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }
  function nextMonth() {
    setViewM((m) => {
      if (m === 11) {
        setViewY((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  const selected = parseISO(value);
  const today = parseISO(todayISO())!;

  const cells = useMemo(() => {
    const first = firstWeekday(viewY, viewM);
    const total = daysInMonth(viewY, viewM);
    const prevTotal = daysInMonth(
      viewM === 0 ? viewY - 1 : viewY,
      viewM === 0 ? 11 : viewM - 1,
    );
    const items: { y: number; m: number; d: number; outside: boolean }[] = [];
    for (let i = first - 1; i >= 0; i--) {
      const d = prevTotal - i;
      const m = viewM === 0 ? 11 : viewM - 1;
      const y = viewM === 0 ? viewY - 1 : viewY;
      items.push({ y, m, d, outside: true });
    }
    for (let d = 1; d <= total; d++) {
      items.push({ y: viewY, m: viewM, d, outside: false });
    }
    while (items.length < 42) {
      const idx = items.length - (first + total);
      const d = idx + 1;
      const m = viewM === 11 ? 0 : viewM + 1;
      const y = viewM === 11 ? viewY + 1 : viewY;
      items.push({ y, m, d, outside: true });
    }
    return items;
  }, [viewY, viewM]);

  const menu =
    open && rect
      ? createPortal(
          <>
            {rect.centered && (
              <div
                className="fixed inset-0 z-[55] bg-black/50"
                aria-hidden
              />
            )}
            <div
              ref={menuRef}
              className={cn(
                "fixed z-[60] surface p-3 shadow-2xl w-[280px] overflow-y-auto scrollbar-thin",
                rect.centered && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              )}
              style={
                rect.centered
                  ? { maxHeight: rect.maxHeight }
                  : {
                      top: rect.placement === "above" ? undefined : rect.top,
                      bottom:
                        rect.placement === "above"
                          ? window.innerHeight - rect.top
                          : undefined,
                      left: rect.left,
                      maxHeight: rect.maxHeight,
                    }
              }
            >
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                className="w-8 h-8 flex items-center justify-center rounded-[8px] text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <polyline points="12 5 7 10 12 15" />
                </svg>
              </button>
              <div className="text-sm font-medium text-fg">
                {MONTH_NAMES[viewM]} {viewY}
              </div>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="w-8 h-8 flex items-center justify-center rounded-[8px] text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <polyline points="8 5 13 10 8 15" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="h-7 flex items-center justify-center text-[11px] font-medium text-fg-subtle"
                >
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, i) => {
                const iso = toISO(cell.y, cell.m, cell.d);
                const isSelected =
                  !!selected &&
                  selected.y === cell.y &&
                  selected.m === cell.m &&
                  selected.d === cell.d;
                const isToday =
                  today.y === cell.y &&
                  today.m === cell.m &&
                  today.d === cell.d;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => commit(iso)}
                    className={cn(
                      "h-8 w-full flex items-center justify-center rounded-[8px] text-sm transition-colors",
                      cell.outside ? "text-fg-subtle/50" : "text-fg-muted",
                      !isSelected && "hover:bg-surface-2 hover:text-fg",
                      isToday &&
                        !isSelected &&
                        "ring-1 ring-inset ring-border-strong text-fg",
                      isSelected &&
                        "bg-accent text-white hover:bg-accent-hover",
                    )}
                  >
                    {cell.d}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => commit(todayISO())}
                className="text-xs text-accent hover:text-accent-hover transition-colors"
              >
                Today
              </button>
              {!required && value && (
                <button
                  type="button"
                  onClick={() => commit("")}
                  className="text-xs text-fg-subtle hover:text-fg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={controlId} className="label-sm">
          {label}
        </label>
      )}

      <button
        ref={buttonRef}
        id={controlId}
        type="button"
        disabled={disabled}
        onClick={toggle}
        aria-haspopup="dialog"
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
        <span className={cn("truncate block", !value && "text-fg-subtle")}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted"
        >
          <rect x="3" y="4.5" width="14" height="13" rx="2" />
          <line x1="3" y1="8.5" x2="17" y2="8.5" />
          <line x1="7" y1="3" x2="7" y2="6" />
          <line x1="13" y1="3" x2="13" y2="6" />
        </svg>
      </button>

      {menu}
    </div>
  );
}
