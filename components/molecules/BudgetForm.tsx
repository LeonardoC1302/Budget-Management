"use client";

import { useMemo, useState } from "react";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import { useCategories } from "@/hooks/useCategories";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import type { Budget, NewBudget } from "@/lib/types";

interface BudgetFormProps {
  initial?: Budget;
  /** Category IDs that already have a budget (excluded from picker). */
  usedCategoryIds: string[];
  onSubmit: (input: NewBudget) => void | Promise<void>;
  onCancel?: () => void;
}

export default function BudgetForm({
  initial,
  usedCategoryIds,
  onSubmit,
  onCancel,
}: BudgetFormProps) {
  const { filterByType, loading } = useCategories();
  const expenseCategories = filterByType("expense");

  const availableCategories = useMemo(() => {
    const used = new Set(usedCategoryIds);
    return expenseCategories.filter(
      (c) => !used.has(c.id) || c.id === initial?.categoryId,
    );
  }, [expenseCategories, usedCategoryIds, initial?.categoryId]);

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initial?.categoryId ?? "",
  );
  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : "",
  );
  const [submitting, setSubmitting] = useState(false);

  const categoryId =
    availableCategories.some((c) => c.id === selectedCategoryId)
      ? selectedCategoryId
      : availableCategories[0]?.id ?? "";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseFloat(amount);
    if (!categoryId || !Number.isFinite(parsed) || parsed <= 0) return;

    setSubmitting(true);
    await onSubmit({
      categoryId,
      amount: parsed,
      currency: BASE_CURRENCY,
    });
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        label="Category"
        name="category"
        value={categoryId}
        onChange={setSelectedCategoryId}
        options={availableCategories.map((c) => ({
          value: c.id,
          label: c.name,
        }))}
        disabled={loading || !!initial || availableCategories.length === 0}
      />

      {availableCategories.length === 0 && !initial && (
        <p className="text-xs text-fg-subtle">
          Every expense category already has a budget. Add a new category first.
        </p>
      )}

      <Input
        label="Monthly cap (USD)"
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

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={submitting || !categoryId}
        >
          {submitting ? "Saving…" : initial ? "Save changes" : "Add budget"}
        </Button>
      </div>
    </form>
  );
}
