"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import Modal from "@/components/atoms/Modal";
import { useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils/cn";
import type { Category, TransactionType } from "@/lib/types";

interface CategoryManageModalProps {
  open: boolean;
  onClose: () => void;
  type: TransactionType;
}

export default function CategoryManageModal({
  open,
  onClose,
  type,
}: CategoryManageModalProps) {
  const { filterByType, usage, remove } = useCategories();
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categories = filterByType(type);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setSubmitting(true);
    try {
      await remove(pendingDelete.id);
      setPendingDelete(null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete category.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`Manage ${type} categories`}
      >
        <div className="flex flex-col gap-4">
          {error && (
            <div className="surface border-expense/40 p-3 text-sm text-expense">
              {error}
            </div>
          )}

          {categories.length === 0 ? (
            <p className="text-sm text-fg-subtle">No categories yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {categories.map((c) => {
                const count = usage[c.id] ?? 0;
                const cannotDelete = c.isDefault || count > 0;
                const reason = c.isDefault
                  ? "Default"
                  : count > 0
                    ? `${count} tx`
                    : null;
                return (
                  <li
                    key={c.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-[10px] px-3 py-2",
                      "bg-surface-2",
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate text-sm text-fg">
                        {c.name}
                      </span>
                      {reason && (
                        <span className="text-[10px] uppercase tracking-wide text-fg-subtle shrink-0">
                          {reason}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setPendingDelete(c);
                      }}
                      disabled={cannotDelete}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-[8px] transition-colors",
                        "text-expense hover:bg-expense-soft",
                        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent",
                      )}
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex justify-end pt-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete category?"
        message={
          <>
            Delete <strong className="text-fg">{pendingDelete?.name}</strong>?
            This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        submitting={submitting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
