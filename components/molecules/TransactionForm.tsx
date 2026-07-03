"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import CategoryPicker from "@/components/molecules/CategoryPicker";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils/cn";
import { todayISODate } from "@/lib/utils/format";
import type { NewTransaction, TransactionType } from "@/lib/types";

interface TransactionFormProps {
  onSubmit: (input: NewTransaction) => void | Promise<void>;
}

export default function TransactionForm({ onSubmit }: TransactionFormProps) {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { filterByType, loading: categoriesLoading } = useCategories();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISODate());
  const [submitting, setSubmitting] = useState(false);

  const categoriesForType = filterByType(type);

  // Effective values: user's explicit pick if valid, otherwise fall back to
  // first available. Derived at render so no effect is needed.
  const accountId =
    accounts.some((a) => a.id === selectedAccountId)
      ? selectedAccountId
      : accounts[0]?.id ?? "";

  const categoryId =
    categoriesForType.some((c) => c.id === selectedCategoryId)
      ? selectedCategoryId
      : categoriesForType[0]?.id ?? "";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    if (!accountId || !categoryId) return;

    setSubmitting(true);
    await onSubmit({
      type,
      amount: parsed,
      accountId,
      categoryId,
      description: description.trim(),
      date,
    });
    setAmount("");
    setDescription("");
    setSubmitting(false);
  }

  const loading = accountsLoading || categoriesLoading;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Transaction type"
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
        label="Amount"
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
        placeholder="Optional"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input
        label="Date"
        name="date"
        type="date"
        required
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={submitting || loading || !accountId || !categoryId}
      >
        {submitting ? "Adding…" : "Add transaction"}
      </Button>
    </form>
  );
}
