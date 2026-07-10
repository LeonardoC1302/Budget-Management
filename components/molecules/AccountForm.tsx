"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import CurrencyCombobox from "@/components/atoms/CurrencyCombobox";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import {
  ACCOUNT_TYPE_LABELS,
  type Account,
  type AccountType,
  type NewAccount,
} from "@/lib/types";

interface AccountFormProps {
  initial?: Account;
  onSubmit: (input: NewAccount) => void | Promise<void>;
  onCancel?: () => void;
}

const TYPE_OPTIONS = (Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map(
  (value) => ({ value, label: ACCOUNT_TYPE_LABELS[value] }),
);

export default function AccountForm({
  initial,
  onSubmit,
  onCancel,
}: AccountFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<AccountType>(initial?.type ?? "cash");
  const [initialBalance, setInitialBalance] = useState(
    initial ? String(initial.initialBalance) : "0",
  );
  const [currency, setCurrency] = useState(initial?.currency ?? BASE_CURRENCY);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedBalance = parseFloat(initialBalance);
    if (!name.trim() || !Number.isFinite(parsedBalance)) return;

    setSubmitting(true);
    await onSubmit({
      name: name.trim(),
      type,
      initialBalance: parsedBalance,
      currency: currency || BASE_CURRENCY,
    });
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Name"
        name="name"
        placeholder="e.g. Chase Debit"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Select
        label="Type"
        name="type"
        value={type}
        onChange={(next) => setType(next as AccountType)}
        options={TYPE_OPTIONS}
      />

      <Input
        label={initial ? "Initial balance" : "Starting balance"}
        name="initialBalance"
        type="number"
        inputMode="decimal"
        step="0.01"
        required
        value={initialBalance}
        onChange={(e) => setInitialBalance(e.target.value)}
      />

      <CurrencyCombobox
        label="Currency"
        name="currency"
        value={currency}
        onChange={setCurrency}
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
        <Button type="submit" size="lg" fullWidth disabled={submitting}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Add account"}
        </Button>
      </div>
    </form>
  );
}
