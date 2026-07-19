"use client";

import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import { nextOccurrenceAfter, toRule } from "@/lib/recurring/engine";
import { cn } from "@/lib/utils/cn";
import { formatDate, todayISODate } from "@/lib/utils/format";
import {
  RECURRENCE_FREQUENCY_LABELS,
  type Account,
  type Category,
  type RecurringTransaction,
} from "@/lib/types";

interface RecurringItemProps {
  template: RecurringTransaction;
  account?: Account;
  category?: Category;
  onEdit?: (template: RecurringTransaction) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string) => void;
}

export default function RecurringItem({
  template,
  account,
  category,
  onEdit,
  onDelete,
  onToggleActive,
}: RecurringItemProps) {
  const isIncome = template.type === "income";
  const isInvestment = template.type === "investment";
  const icon = isInvestment ? "▲" : isIncome ? "↑" : "↓";
  const iconClass = isInvestment
    ? "text-invest"
    : isIncome
      ? "text-income"
      : "text-expense";
  const tone: "income" | "expense" | "neutral" = isInvestment
    ? "neutral"
    : isIncome
      ? "income"
      : "expense";

  const title =
    template.description || category?.name || "Untitled recurring";
  const next = template.active
    ? nextOccurrenceAfter(toRule(template), todayISODate())
    : undefined;
  const cadence = RECURRENCE_FREQUENCY_LABELS[template.frequency];
  const nextLabel = template.active
    ? next
      ? `Next: ${formatDate(next)}`
      : "No upcoming occurrences"
    : "Paused";

  const subtitle = `${cadence} · ${category?.name ?? "—"}${
    account ? ` · ${account.name}` : ""
  }`;

  return (
    <li className={cn("flex items-center gap-3 py-3", !template.active && "opacity-60")}>
      <div
        aria-hidden
        className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-surface-2 border border-border text-base"
      >
        <span className={iconClass}>{icon}</span>
      </div>

      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium text-fg truncate flex items-center gap-1.5">
          <span className="truncate">{title}</span>
          <span aria-hidden className="text-xs text-fg-subtle shrink-0">↻</span>
        </p>
        <p className="text-xs text-fg-subtle truncate">{subtitle}</p>
        <p className="text-xs text-fg-subtle truncate">{nextLabel}</p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <Amount
          value={template.amount}
          tone={tone}
          size="sm"
          currency={template.currency}
          showSign={!isInvestment}
          className={isInvestment ? "text-invest" : undefined}
        />
        <div className="flex gap-1">
          {onToggleActive && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={template.active ? "Pause" : "Resume"}
              onClick={() => onToggleActive(template.id)}
              className="px-2"
            >
              {template.active ? "⏸" : "▶"}
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              aria-label="Edit"
              onClick={() => onEdit(template)}
              className="px-2"
            >
              ✎
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              aria-label="Delete"
              onClick={() => onDelete(template.id)}
              className="px-2"
            >
              ×
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
