"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/atoms/Button";
import CurrencySelect from "@/components/atoms/CurrencySelect";
import DatePicker from "@/components/atoms/DatePicker";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import CategoryPicker from "@/components/molecules/CategoryPicker";
import EntityRatePicker, {
  type FxDirection,
  type ResolvedRate,
} from "@/components/molecules/EntityRatePicker";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { getRate } from "@/lib/services/exchangeRates";
import { cn } from "@/lib/utils/cn";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import { formatCurrency, todayISODate } from "@/lib/utils/format";
import {
  RECURRENCE_FREQUENCY_LABELS,
  type EntryType,
  type NewRecurringTransaction,
  type RecurrenceFrequency,
  type RecurringTransaction,
} from "@/lib/types";

interface RecurringFormProps {
  initial?: RecurringTransaction;
  onSubmit: (input: NewRecurringTransaction) => void | Promise<void>;
  onCancel?: () => void;
}

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

  const initialType: EntryType =
    initial && initial.type !== "investment" ? initial.type : "expense";
  const [type, setType] = useState<EntryType>(initialType);
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
  // Explicit user override for the template currency. `null` means "track the
  // account's currency", so switching accounts still auto-updates.
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(
    initial ? initial.currency : null,
  );

  const categoriesForType = filterByType(type);

  const accountId = accounts.some((a) => a.id === selectedAccountId)
    ? selectedAccountId
    : accounts[0]?.id ?? "";
  const accountCurrency =
    accounts.find((a) => a.id === accountId)?.currency ?? BASE_CURRENCY;
  const categoryId = categoriesForType.some((c) => c.id === selectedCategoryId)
    ? selectedCategoryId
    : categoriesForType[0]?.id ?? "";

  const currency = currencyOverride ?? accountCurrency;
  const hasCurrencyMismatch = currency !== accountCurrency;

  const direction = useMemo<FxDirection | null>(() => {
    if (!hasCurrencyMismatch) return null;
    if (currency === "USD" && accountCurrency === "CRC") return "USD_TO_CRC";
    if (currency === "CRC" && accountCurrency === "USD") return "CRC_TO_USD";
    return null;
  }, [currency, accountCurrency, hasCurrencyMismatch]);

  const [entityId, setEntityId] = useState<string | null>(
    initial?.rateBccrEntity?.id ?? null,
  );
  const [bccrResolved, setBccrResolved] = useState<ResolvedRate | null>(null);
  const [bccrFallback, setBccrFallback] = useState(false);
  const onResolved = useCallback(
    (result: { resolved: ResolvedRate | null; fallback: boolean }) => {
      setBccrResolved(result.resolved);
      setBccrFallback(result.fallback);
    },
    [],
  );

  const [rateEntry, setRateEntry] = useState<{
    key: string;
    rate: number | null;
    error: string | null;
  }>({ key: "", rate: null, error: null });
  const pairKey = `${currency}:${accountCurrency}`;
  const needsFallback = hasCurrencyMismatch && (!direction || bccrFallback);
  useEffect(() => {
    if (!needsFallback) return;
    let cancelled = false;
    getRate(currency, accountCurrency)
      .then((r) => {
        if (!cancelled) setRateEntry({ key: pairKey, rate: r, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRateEntry({
            key: pairKey,
            rate: null,
            error: err instanceof Error ? err.message : "Rate unavailable",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [needsFallback, currency, accountCurrency, pairKey]);

  const parsedAmountForPreview = parseFloat(amount);
  const previewRate: number | null = !hasCurrencyMismatch
    ? 1
    : direction && bccrResolved && !bccrFallback
      ? direction === "USD_TO_CRC"
        ? bccrResolved.rate
        : bccrResolved.rate === 0
          ? null
          : 1 / bccrResolved.rate
      : rateEntry.key === pairKey
        ? rateEntry.rate
        : null;
  const convertedPreview =
    hasCurrencyMismatch &&
    previewRate !== null &&
    Number.isFinite(parsedAmountForPreview) &&
    parsedAmountForPreview > 0
      ? parsedAmountForPreview * previewRate
      : null;

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

    const rateBccrEntity =
      hasCurrencyMismatch && direction && bccrResolved && !bccrFallback
        ? { id: bccrResolved.entity.id, name: bccrResolved.entity.name }
        : undefined;

    setSubmitting(true);
    try {
      await onSubmit({
        type,
        amount: parsedAmount,
        currency,
        accountId,
        categoryId,
        description: description.trim(),
        frequency,
        startDate,
        semiMonthlyDays,
        endDate: endDate || undefined,
        active: initial?.active ?? true,
        rateBccrEntity,
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
        {(["expense", "income"] as const).map((t) => {
          const activeClass =
            t === "income"
              ? "bg-income-soft text-income"
              : "bg-expense-soft text-expense";
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={type === t}
              onClick={() => setType(t)}
              className={cn(
                "h-9 text-sm font-medium rounded-[8px] transition-colors capitalize",
                type === t ? activeClass : "text-fg-muted hover:text-fg",
              )}
            >
              {t}
            </button>
          );
        })}
      </div>

      <Input
        label={`Amount (${currency})`}
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

      <div className="flex flex-col gap-1.5">
        <CurrencySelect
          label="Currency"
          name="currency"
          value={currency}
          onChange={(next) =>
            setCurrencyOverride(next === accountCurrency ? null : next)
          }
        />
        {hasCurrencyMismatch && direction && (
          <EntityRatePicker
            direction={direction}
            value={entityId}
            onChange={setEntityId}
            onResolved={onResolved}
          />
        )}
        {hasCurrencyMismatch && (
          <p role="status" className="text-xs text-fg-subtle">
            {convertedPreview !== null
              ? `≈ ${formatCurrency(convertedPreview, accountCurrency)} on the ${accountCurrency} account · rate re-fetched each occurrence`
              : rateEntry.error
                ? `Rate unavailable (${rateEntry.error}).`
                : `Fetching ${currency} → ${accountCurrency} rate…`}
          </p>
        )}
      </div>

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
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-fg-muted">
            Two days each month
          </span>
          <p className="text-xs text-fg-subtle">
            If a month has fewer days, the rule falls on the last day of the
            month. Choose two different days.
          </p>
          <div className="grid grid-cols-2 gap-3 items-end">
            <Select
              label="First day"
              name="dayA"
              value={dayA}
              onChange={setDayA}
              options={Array.from({ length: 31 }, (_, i) => ({
                value: String(i + 1),
                label: String(i + 1),
              }))}
            />
            <Select
              label="Second day"
              name="dayB"
              value={dayB}
              onChange={setDayB}
              options={Array.from({ length: 31 }, (_, i) => ({
                value: String(i + 1),
                label: String(i + 1),
              }))}
            />
          </div>
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
