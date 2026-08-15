"use client";

import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import {
  DeleteIcon,
  EditIcon,
  PauseIcon,
  PlayIcon,
  RefreshIcon,
} from "@/lib/action/icons";
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
  const tone: "income" | "expense" | "neutral" = isInvestment
    ? "neutral"
    : isIncome
      ? "income"
      : "expense";
  const dotClass = isInvestment
    ? "text-invest"
    : isIncome
      ? "text-income"
      : "text-expense";

  const title = template.description || category?.name || "Untitled recurring";
  const next = template.active
    ? nextOccurrenceAfter(toRule(template), todayISODate())
    : undefined;
  const cadence = RECURRENCE_FREQUENCY_LABELS[template.frequency];
  const nextLabel = template.active
    ? next
      ? `Next · ${formatDate(next)}`
      : "No upcoming occurrences"
    : "Paused";

  const subtitle = [cadence, category?.name, account?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className={cn("px-4 py-4 flex items-start gap-3", !template.active && "opacity-70")}
    >
      <span
        aria-hidden
        className={cn("mt-2 w-1.5 h-1.5 rounded-full shrink-0", dotClass)}
        style={{ background: "currentColor" }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-serif text-base text-fg truncate">{title}</span>
          <RefreshIcon
            width={12}
            height={12}
            className="text-fg-subtle shrink-0"
            aria-hidden
          />
        </div>
        <p className="text-[11px] text-fg-muted mt-1 uppercase tracking-[0.14em] truncate">
          {subtitle}
        </p>
        <p className="lede text-xs mt-1">{nextLabel}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0 min-w-0 max-w-[45%]">
        <Amount
          value={template.amount}
          tone={tone}
          size="md"
          currency={template.currency}
          showSign={!isInvestment}
          className={cn("font-serif truncate max-w-full", isInvestment && "text-invest")}
        />
        <div className="flex flex-wrap justify-end gap-1">
          {onToggleActive && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={template.active ? "Pause" : "Resume"}
              onClick={() => onToggleActive(template.id)}
              className="px-2"
            >
              {template.active ? (
                <PauseIcon aria-hidden />
              ) : (
                <PlayIcon aria-hidden />
              )}
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
              <EditIcon aria-hidden />
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
              <DeleteIcon aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
