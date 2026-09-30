"use client";

import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { normalizeTag } from "@/lib/utils/tags";

import { t } from "@/lib/i18n";
interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

/**
 * Chips plus a free-text field. Enter, comma or space commits a tag;
 * Backspace on an empty field removes the last one. Known tags are offered
 * as tap-to-add suggestions filtered by what's typed.
 */
export default function TagInput({
  label = t("Tags"),
  value,
  onChange,
  suggestions = [],
  placeholder = t("Add a tag, e.g. japan-trip"),
}: TagInputProps) {
  const inputId = useId();
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const tag = normalizeTag(raw);
    if (!tag || value.includes(tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  const query = normalizeTag(draft);
  const matches = useMemo(
    () =>
      suggestions
        .filter((s) => !value.includes(s) && (!query || s.includes(query)))
        .slice(0, 6),
    [suggestions, value, query],
  );

  return (
    <div className="field">
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      <div
        className={cn(
          "input flex flex-wrap items-center gap-1.5 h-auto min-h-[2.75rem] py-1.5",
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-border px-2 py-0.5 text-xs text-fg"
          >
            #{tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              aria-label={t("Remove tag {tag}", { tag })}
              className="text-fg-subtle hover:text-fg"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={inputId}
          value={draft}
          onChange={(e) => {
            const next = e.target.value;
            if (/[,\s]$/.test(next)) commit(next);
            else setDraft(next);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && value.length > 0) {
              remove(value[value.length - 1]);
            }
          }}
          onBlur={() => draft.trim() && commit(draft)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[8rem] bg-transparent outline-none text-sm"
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>
      {matches.length > 0 && (draft || value.length === 0) && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {matches.map((tag) => (
            <button
              key={tag}
              type="button"
              // Keep focus in the field so blur doesn't commit the half-typed draft.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(tag)}
              className="filter shrink-0 text-xs"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
