"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import type { Category, NewCategory } from "@/lib/types";

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
        Adding a new{" "}
        <span
          className={
            type === "income"
              ? "text-income"
              : type === "expense"
                ? "text-expense"
                : "text-invest"
          }
        >
          {type}
        </span>{" "}
        category.
      </p>

      <Input
        label="Name"
        name="category-name"
        placeholder="e.g. Groceries"
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
            Cancel
          </Button>
        )}
        <Button type="submit" size="lg" fullWidth disabled={submitting}>
          {submitting ? "Adding…" : "Add category"}
        </Button>
      </div>
    </form>
  );
}
