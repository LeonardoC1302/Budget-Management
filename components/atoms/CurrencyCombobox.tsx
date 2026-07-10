"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { SUPPORTED_CURRENCIES, currencyLabel } from "@/lib/utils/currencies";

interface CurrencyComboboxProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
}

interface MenuRect {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "below" | "above";
}

export default function CurrencyCombobox({
  label,
  value,
  onChange,
  disabled,
  id,
  name,
  placeholder = "Select currency…",
}: CurrencyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [rect, setRect] = useState<MenuRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const controlId = id ?? name;

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return SUPPORTED_CURRENCIES;
    return SUPPORTED_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    );
  }, [filter]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setFilter("");
    setActiveIndex(0);
  }, []);

  const commit = useCallback(
    (next: string) => {
      onChange(next);
      closeMenu();
      buttonRef.current?.focus();
    },
    [onChange, closeMenu],
  );

  const positionMenu = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const btnRect = button.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const margin = 16;
    const gap = 4;
    const desired = 340;
    const spaceBelow = viewportH - btnRect.bottom - gap - margin;
    const spaceAbove = btnRect.top - gap - margin;
    const placeAbove = spaceBelow < desired && spaceAbove > spaceBelow;
    const maxHeight = Math.min(desired, Math.max(180, placeAbove ? spaceAbove : spaceBelow));
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
    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [open]);

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
      closeMenu();
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        buttonRef.current?.focus();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (event.key === "Enter") {
        if (activeIndex >= 0 && activeIndex < filtered.length) {
          event.preventDefault();
          commit(filtered[activeIndex].code);
        }
      }
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, filtered, activeIndex, closeMenu, commit]);

  useEffect(() => {
    const list = listRef.current;
    if (!open || !list) return;
    const item = list.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function toggle() {
    if (disabled) return;
    setOpen((prev) => {
      if (prev) return false;
      setFilter("");
      setActiveIndex(0);
      return true;
    });
  }

  const menu =
    open && rect
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[60] surface p-1 shadow-2xl flex flex-col"
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
            <input
              ref={inputRef}
              type="text"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setActiveIndex(0);
              }}
              placeholder="Search currency…"
              className={cn(
                "w-full h-9 px-3 mb-1 bg-surface text-fg text-sm placeholder:text-fg-subtle shrink-0",
                "border border-border rounded-[8px]",
                "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
              )}
            />
            <div
              ref={listRef}
              role="listbox"
              aria-labelledby={controlId}
              className="flex-1 min-h-0 overflow-y-auto scrollbar-thin"
            >
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-fg-subtle">
                  No matches
                </div>
              ) : (
                filtered.map((c, i) => {
                  const isSelected = c.code === value;
                  const isActive = i === activeIndex;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      role="option"
                      data-index={i}
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => commit(c.code)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-[8px] text-sm transition-colors flex items-center justify-between gap-3",
                        isActive
                          ? "bg-surface-2 text-fg"
                          : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                        isSelected && "text-fg",
                      )}
                    >
                      <span className="truncate">
                        <span className="font-medium">{c.code}</span>
                        <span className="text-fg-subtle"> — {c.name}</span>
                      </span>
                      {isSelected && (
                        <span aria-hidden className="text-accent shrink-0">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
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
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "h-11 pl-3.5 pr-10 w-full bg-surface-2 text-fg text-left text-sm",
          "border border-border rounded-[10px] relative",
          "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
          "transition-colors cursor-pointer",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        <span className={cn("truncate block", !value && "text-fg-subtle")}>
          {value ? currencyLabel(value) : placeholder}
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

      {menu}
    </div>
  );
}
