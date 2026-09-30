"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import type { Category, NewCategory } from "@/lib/types";

import { t } from "@/lib/i18n";
interface CategoryFormProps {
  type: Category["type"];
  onSubmit: (input: NewCategory) => void | Promise<void>;
  onCancel?: () => void;
}

export default function CategoryForm({
  type,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!name.trim()) return;
    setSubmitting(true);
    await onSubmit({ name: name.trim(), type });
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-xs text-fg-subtle">
        <span
          className={
            type === "income"
              ? "text-income"
              : type === "expense"
                ? "text-expense"
                : "text-invest"
          }
        >
          {type === "income"
            ? t("Adding a new income category.")
            : type === "expense"
              ? t("Adding a new expense category.")
              : t("Adding a new investment category.")}
        </span>
      </p>

      <Input
        label={t("Name")}
        name="category-name"
        placeholder={t("e.g. Groceries")}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
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
            {t("Cancel")}
          </Button>
        )}
        <Button type="submit" size="lg" fullWidth disabled={submitting}>
          {submitting ? t("Adding…") : t("Add category")}
        </Button>
      </div>
    </form>
  );
}
