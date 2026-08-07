"use client";

import { useEffect, useState } from "react";
import Button from "@/components/atoms/Button";
import CurrencyCombobox from "@/components/atoms/CurrencyCombobox";
import DatePicker from "@/components/atoms/DatePicker";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import CategoryPicker from "@/components/molecules/CategoryPicker";
import { useAccounts } from "@/hooks/useAccounts";
import { useBudgets } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { getRate } from "@/lib/services/exchangeRates";
import { cn } from "@/lib/utils/cn";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import { formatCurrency, todayISODate } from "@/lib/utils/format";
import type { EntryType, NewTransaction, Transaction } from "@/lib/types";

interface TransactionFormProps {
  onSubmit: (input: NewTransaction) => void | Promise<void>;
  initial?: Transaction;
  submitLabel?: string;
}

export default function TransactionForm({
  onSubmit,
  initial,
  submitLabel,
}: TransactionFormProps) {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { filterByType, byId: categoriesById, loading: categoriesLoading } = useCategories();
  const { byCategoryId: budgetsByCategoryId, wouldExceed } = useBudgets();

  const initialType: EntryType =
    initial && initial.type !== "transfer" && initial.type !== "investment"
      ? initial.type
      : "expense";
  const isEditing = !!initial;

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
  const [date, setDate] = useState(initial?.date ?? todayISODate());
  const [submitting, setSubmitting] = useState(false);
  // Explicit user override for the transaction currency. `null` means "track
  // the account's currency", so switching accounts still auto-updates.
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(
    initial ? initial.currency : null,
  );

  const categoriesForType = filterByType(type);

  // Effective values: user's explicit pick if valid, otherwise fall back to
  // first available. Derived at render so no effect is needed.
  const accountId =
    accounts.some((a) => a.id === selectedAccountId)
      ? selectedAccountId
      : accounts[0]?.id ?? "";

  const accountCurrency =
    accounts.find((a) => a.id === accountId)?.currency ?? BASE_CURRENCY;

  const currency = currencyOverride ?? accountCurrency;
  const hasCurrencyMismatch = currency !== accountCurrency;

  const categoryId =
    categoriesForType.some((c) => c.id === selectedCategoryId)
      ? selectedCategoryId
      : categoriesForType[0]?.id ?? "";

  // Preview the account-currency equivalent so the user can sanity-check the
  // rate before saving. Debounced by React batching + effect deps.
  const [rateEntry, setRateEntry] = useState<{
    key: string;
    rate: number | null;
    error: string | null;
  }>({ key: "", rate: null, error: null });
  const pairKey = `${currency}:${accountCurrency}`;
  useEffect(() => {
    if (!hasCurrencyMismatch) return;
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
  }, [currency, accountCurrency, hasCurrencyMismatch, pairKey]);

  const parsedAmount = parseFloat(amount);
  const previewRate =
    hasCurrencyMismatch && rateEntry.key === pairKey ? rateEntry.rate : null;
  const convertedPreview =
    hasCurrencyMismatch &&
    previewRate !== null &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0
      ? parsedAmount * previewRate
      : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    if (!accountId || !categoryId) return;

    setSubmitting(true);
    await onSubmit({
      type,
      amount: parsed,
      currency,
      accountId,
      categoryId,
      description: description.trim(),
      date,
      ...(initial?.recurringId ? { recurringId: initial.recurringId } : {}),
    });
    if (!isEditing) {
      setAmount("");
      setDescription("");
    }
    setSubmitting(false);
  }

  const loading = accountsLoading || categoriesLoading;

  const budget = budgetsByCategoryId[categoryId];
  const overBudgetWarning =
    type === "expense" &&
    accountCurrency === BASE_CURRENCY &&
    !hasCurrencyMismatch &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    !!budget &&
    wouldExceed(categoryId, parsedAmount)
      ? `This would push ${categoriesById[categoryId]?.name ?? "this category"} over its ${formatCurrency(budget.amount, budget.currency)} cap.`
      : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Transaction type"
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

      <div className="flex flex-col gap-1.5">
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
        {overBudgetWarning ? (
          <p role="status" className="text-xs text-expense">
            {overBudgetWarning}
          </p>
        ) : amount.trim() !== "" &&
          (!Number.isFinite(parsedAmount) || parsedAmount <= 0) ? (
          <p role="status" className="text-xs text-fg-subtle">
            Enter an amount greater than zero to enable the save button.
          </p>
        ) : null}
      </div>

      <Select
        label="Account"
        name="account"
        value={accountId}
        onChange={setSelectedAccountId}
        options={accounts.map((a) => ({ value: a.id, label: a.name }))}
        disabled={loading || accounts.length === 0}
      />

      <div className="flex flex-col gap-1.5">
        <CurrencyCombobox
          label="Currency"
          name="currency"
          value={currency}
          onChange={(next) =>
            setCurrencyOverride(next === accountCurrency ? null : next)
          }
        />
        {hasCurrencyMismatch && (
          <p role="status" className="text-xs text-fg-subtle">
            {convertedPreview !== null
              ? `≈ ${formatCurrency(convertedPreview, accountCurrency)} on the ${accountCurrency} account`
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
        placeholder="Optional"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <DatePicker
        label="Date"
        name="date"
        required
        value={date}
        onChange={setDate}
      />

      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={submitting || loading || !accountId || !categoryId}
      >
        {submitting
          ? isEditing ? "Saving…" : "Adding…"
          : submitLabel ?? (isEditing ? "Save changes" : "Add transaction")}
      </Button>
    </form>
  );
}
