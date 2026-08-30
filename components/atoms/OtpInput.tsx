"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils/cn";

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (next: string) => void;
  onComplete?: (next: string) => void;
  label?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  // Only keep characters matching this regex. Defaults to the friendly OTP
  // alphabet used by connection codes (uppercase alnum minus lookalikes).
  allow?: RegExp;
}

const DEFAULT_ALLOW = /[A-HJ-KM-NP-Z2-9]/gi;

// Fixed-width segmented input for one-time codes. Behaves like the 2FA field
// you're used to: each character is its own box, focus auto-advances, backspace
// walks back and clears, arrow keys move between cells, and pasting the full
// code fills every box at once.
export default function OtpInput({
  length,
  value,
  onChange,
  onComplete,
  label,
  autoFocus,
  disabled,
  allow = DEFAULT_ALLOW,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [focused, setFocused] = useState<number | null>(null);

  // Normalise once; `value` is always the tight `[A-Z0-9]{0,length}` version.
  const chars = value.slice(0, length).padEnd(length, " ").split("");

  const emit = useCallback(
    (next: string) => {
      const trimmed = next.slice(0, length);
      onChange(trimmed);
      if (trimmed.length === length && onComplete) onComplete(trimmed);
    },
    [length, onChange, onComplete],
  );

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function focusCell(i: number) {
    const el = refs.current[i];
    if (!el) return;
    el.focus();
    // Select so the next keystroke replaces the current character rather
    // than being blocked by `maxLength={1}`.
    queueMicrotask(() => el.select());
  }

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    // `maxLength=1` bounds the input, but mobile IMEs sometimes deliver
    // multiple characters at once — take the last valid one.
    const raw = event.target.value.toUpperCase();
    const filtered = raw.match(allow)?.join("") ?? "";
    if (!filtered) {
      // Nothing valid typed; if the cell was cleared (backspace), let it go.
      if (raw === "") {
        const next = value.slice(0, index) + value.slice(index + 1);
        emit(next);
      }
      return;
    }
    const ch = filtered.slice(-1);
    const before = value.slice(0, index);
    const after = value.slice(index + 1);
    const next = (before + ch + after).slice(0, length);
    emit(next);
    const nextFocus = Math.min(index + 1, length - 1);
    focusCell(nextFocus);
  }

  function handleKey(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (chars[index] && chars[index] !== " ") {
        // Cell has a char — let the browser clear it and fire onChange.
        return;
      }
      // Empty cell: walk back.
      event.preventDefault();
      if (index > 0) {
        const next = value.slice(0, index - 1) + value.slice(index);
        emit(next);
        focusCell(index - 1);
      }
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusCell(index - 1);
      return;
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusCell(index + 1);
      return;
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const raw = event.clipboardData.getData("text").toUpperCase();
    const filtered = (raw.match(allow)?.join("") ?? "").slice(0, length);
    if (!filtered) return;
    emit(filtered);
    const nextFocus = Math.min(filtered.length, length - 1);
    focusCell(nextFocus);
  }

  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <div className="flex gap-2 justify-between" role="group" aria-label={label}>
        {chars.map((ch, i) => {
          const isFocused = focused === i;
          const hasChar = ch !== " ";
          return (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              disabled={disabled}
              value={hasChar ? ch : ""}
              maxLength={1}
              aria-label={`Character ${i + 1} of ${length}`}
              onFocus={(e) => {
                setFocused(i);
                e.currentTarget.select();
              }}
              onBlur={() => setFocused((prev) => (prev === i ? null : prev))}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKey(i, e)}
              onPaste={handlePaste}
              className={cn(
                "input text-center font-mono text-xl tracking-widest w-full px-0",
                "aspect-square",
                isFocused && "ring-2 ring-accent/60",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
