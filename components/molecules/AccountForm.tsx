"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import CurrencySelect from "@/components/atoms/CurrencySelect";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import {
  ACCOUNT_TYPE_LABELS,
  type Account,
  type AccountType,
  type NewAccount,
} from "@/lib/types";

import { t } from "@/lib/i18n";
interface AccountFormProps {
  initial?: Account;
  onSubmit: (input: NewAccount) => void | Promise<void>;
  onCancel?: () => void;
}

const TYPE_OPTIONS = (Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[])
  .filter((value) => value !== "credit")
  .map((value) => ({ value, label: ACCOUNT_TYPE_LABELS[value] }));

const typeOptions = () => TYPE_OPTIONS.map((o) => ({ ...o, label: t(o.label) }));

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
        label={t("Name")}
        name="name"
        placeholder={t("e.g. Chase Debit")}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Select
        label={t("Type")}
        name="type"
        value={type}
        onChange={(next) => setType(next as AccountType)}
        options={typeOptions()}
      />

      <Input
        label={initial ? t("Initial balance") : t("Starting balance")}
        name="initialBalance"
        type="number"
        inputMode="decimal"
        step="0.01"
        required
        value={initialBalance}
        onChange={(e) => setInitialBalance(e.target.value)}
      />

      <CurrencySelect
        label={t("Currency")}
        name="currency"
        value={currency}
        onChange={setCurrency}
      />

      <p className="text-xs text-fg-subtle">
        {t("Adding a credit card? Manage those on the")}{" "}
        <a
          href="/cards"
          className="text-fg-muted hover:text-fg underline decoration-dotted underline-offset-4"
        >
          {t("Cards")}
        </a>{" "}
        {t("tab.")}
      </p>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onCancel}
          >
            {t("Cancel")}
          </Button>
        )}
        <Button type="submit" size="lg" fullWidth disabled={submitting}>
          {submitting ? t("Saving…") : initial ? t("Save changes") : t("Add account")}
        </Button>
      </div>
    </form>
  );
}
