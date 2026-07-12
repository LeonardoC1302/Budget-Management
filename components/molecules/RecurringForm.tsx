"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import DatePicker from "@/components/atoms/DatePicker";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import CategoryPicker from "@/components/molecules/CategoryPicker";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils/cn";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import { todayISODate } from "@/lib/utils/format";
import {
  RECURRENCE_FREQUENCY_LABELS,
  type NewRecurringTransaction,
  type RecurrenceFrequency,
  type RecurringTransaction,
} from "@/lib/types";

interface RecurringFormProps {
  initial?: RecurringTransaction;
  onSubmit: (input: NewRecurringTransaction) => void | Promise<void>;
  onCancel?: () => void;
}

type EntryType = "income" | "expense";

const FREQUENCY_OPTIONS = (
  Object.keys(RECURRENCE_FREQUENCY_LABELS) as RecurrenceFrequency[]
).map((v) => ({ value: v, label: RECURRENCE_FREQUENCY_LABELS[v] }));

export default function RecurringForm({
  initial,
  onSubmit,
  onCancel,
}: RecurringFormProps) {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { filterByType, loading: categoriesLoading } = useCategories();

  const [type, setType] = useState<EntryType>(initial?.type ?? "expense");
  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : "",
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    initial?.accountId ?? "",
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initial?.categoryId ?? "",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    initial?.frequency ?? "monthly",
  );
  const [startDate, setStartDate] = useState(
    initial?.startDate ?? todayISODate(),
  );
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const initialDays = initial?.semiMonthlyDays ?? [15, 30];
  const [dayA, setDayA] = useState<string>(String(initialDays[0]));
  const [dayB, setDayB] = useState<string>(String(initialDays[1]));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriesForType = filterByType(type);

  const accountId = accounts.some((a) => a.id === selectedAccountId)
    ? selectedAccountId
    : accounts[0]?.id ?? "";
  const accountCurrency =
    accounts.find((a) => a.id === accountId)?.currency ?? BASE_CURRENCY;
  const categoryId = categoriesForType.some((c) => c.id === selectedCategoryId)
    ? selectedCategoryId
    : categoriesForType[0]?.id ?? "";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a positive amount.");
      return;
    }
    if (!accountId || !categoryId) {
      setError("Pick an account and category.");
      return;
    }
    if (!startDate) {
      setError("Pick a start date.");
      return;
    }

    let semiMonthlyDays: [number, number] | undefined;
    if (frequency === "semi-monthly") {
      const a = parseInt(dayA, 10);
      const b = parseInt(dayB, 10);
      if (!Number.isInteger(a) || !Number.isInteger(b)) {
        setError("Enter two valid days.");
        return;
      }
      if (a < 1 || a > 31 || b < 1 || b > 31) {
        setError("Days must be between 1 and 31.");
        return;
      }
      if (a === b) {
        setError("The two days must be different.");
        return;
      }
      semiMonthlyDays = a < b ? [a, b] : [b, a];
    }

    if (endDate && endDate < startDate) {
      setError("End date must be after start date.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        type,
        amount: parsedAmount,
        currency: accountCurrency,
        accountId,
        categoryId,
        description: description.trim(),
        frequency,
        startDate,
        semiMonthlyDays,
        endDate: endDate || undefined,
        active: initial?.active ?? true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const loading = accountsLoading || categoriesLoading;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Recurring type"
        className="grid grid-cols-2 p-1 bg-surface-2 border border-border rounded-[12px]"
      >
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={type === t}
            onClick={() => setType(t)}
            className={cn(
              "h-9 text-sm font-medium rounded-[8px] transition-colors capitalize",
              type === t
                ? t === "income"
                  ? "bg-income-soft text-income"
                  : "bg-expense-soft text-expense"
                : "text-fg-muted hover:text-fg",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <Input
        label={`Amount (${accountCurrency})`}
        name="amount"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="0.00"
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <Select
        label="Account"
        name="account"
        value={accountId}
        onChange={setSelectedAccountId}
        options={accounts.map((a) => ({ value: a.id, label: a.name }))}
        disabled={loading || accounts.length === 0}
      />

      <CategoryPicker
        type={type}
        value={categoryId}
        onChange={setSelectedCategoryId}
      />

      <Input
        label="Description"
        name="description"
        placeholder="e.g. Salary, Netflix"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Select
        label="Frequency"
        name="frequency"
        value={frequency}
        onChange={(v) => setFrequency(v as RecurrenceFrequency)}
        options={FREQUENCY_OPTIONS}
      />

      {frequency === "semi-monthly" && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First day"
            name="dayA"
            type="number"
            inputMode="numeric"
            min="1"
            max="31"
            value={dayA}
            onChange={(e) => setDayA(e.target.value)}
            hint="1–31; last-of-month if fewer days."
          />
          <Input
            label="Second day"
            name="dayB"
            type="number"
            inputMode="numeric"
            min="1"
            max="31"
            value={dayB}
            onChange={(e) => setDayB(e.target.value)}
          />
        </div>
      )}

      <DatePicker
        label="Start date (first occurrence)"
        name="startDate"
        required
        value={startDate}
        onChange={setStartDate}
      />

      <DatePicker
        label="End date (optional)"
        name="endDate"
        value={endDate}
        onChange={setEndDate}
      />

      {error && (
        <p role="alert" className="text-xs text-expense">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            fullWidth
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={submitting || loading || !accountId || !categoryId}
        >
          {submitting ? "Saving…" : initial ? "Save changes" : "Create recurring"}
        </Button>
      </div>
    </form>
  );
}
