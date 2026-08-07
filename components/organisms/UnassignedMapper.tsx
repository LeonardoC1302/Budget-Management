"use client";

import { useMemo, useState } from "react";
import Button from "@/components/atoms/Button";
import Modal from "@/components/atoms/Modal";
import Select from "@/components/atoms/Select";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type {
  Account,
  Category,
  Holding,
  Transaction,
} from "@/lib/types";

interface UnassignedMapperProps {
  open: boolean;
  transactions: Transaction[];
  holdings: Holding[];
  accountsById: Record<string, Account | undefined>;
  categoriesById: Record<string, Category | undefined>;
  onClose: () => void;
  onAssign: (
    transactionIds: string[],
    holdingId: string,
  ) => void | Promise<void>;
}

type Scope = "single" | "byCategory" | "all";

export default function UnassignedMapper({
  open,
  transactions,
  holdings,
  accountsById,
  categoriesById,
  onClose,
  onAssign,
}: UnassignedMapperProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("single");
  const [targetHoldingId, setTargetHoldingId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selected = transactions.find((t) => t.id === selectedId) ?? null;
  const category = selected
    ? categoriesById[selected.categoryId]
    : undefined;

  const affected = useMemo(() => {
    if (!selected) return [];
    if (scope === "single") return [selected];
    if (scope === "byCategory")
      return transactions.filter(
        (t) => t.categoryId === selected.categoryId,
      );
    return transactions;
  }, [scope, selected, transactions]);

  async function handleAssign() {
    if (!targetHoldingId || affected.length === 0) return;
    setSubmitting(true);
    try {
      await onAssign(
        affected.map((t) => t.id),
        targetHoldingId,
      );
      setSelectedId(null);
      setScope("single");
      setTargetHoldingId("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Unassigned contributions">
      <div className="flex flex-col gap-4">
        {holdings.length === 0 && (
          <p className="text-sm text-fg-subtle">
            Create a holding first to move these contributions into it.
          </p>
        )}

        {selected ? (
          <>
            <div className="rounded-[10px] bg-surface-2 border border-border px-4 py-3">
              <p className="text-xs text-fg-subtle">
                {formatDate(selected.date)}
                {accountsById[selected.accountId]
                  ? ` · ${accountsById[selected.accountId]?.name}`
                  : ""}
              </p>
              <p className="text-sm text-fg">
                {selected.description || category?.name || "Investment"}
              </p>
              <p className="text-sm text-fg tabular-nums">
                {formatCurrency(selected.amount, selected.currency)}
              </p>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="label-sm">Move</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="scope"
                  value="single"
                  checked={scope === "single"}
                  onChange={() => setScope("single")}
                />
                Just this one
              </label>
              {category && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="scope"
                    value="byCategory"
                    checked={scope === "byCategory"}
                    onChange={() => setScope("byCategory")}
                  />
                  All under &quot;{category.name}&quot; (
                  {
                    transactions.filter(
                      (t) => t.categoryId === selected.categoryId,
                    ).length
                  }
                  )
                </label>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="scope"
                  value="all"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                />
                All unassigned ({transactions.length})
              </label>
            </fieldset>

            <Select
              label="Target holding"
              name="target"
              value={targetHoldingId}
              onChange={setTargetHoldingId}
              options={[
                { value: "", label: "— Pick a holding —" },
                ...holdings.map((h) => ({
                  value: h.id,
                  label: h.symbol ? `${h.symbol} · ${h.name}` : h.name,
                })),
              ]}
            />

            <p className="text-xs text-fg-subtle">
              {affected.length} contribution{affected.length === 1 ? "" : "s"}{" "}
              will move. Prices are not backfilled — they will show as cost
              basis only under the new holding.
            </p>

            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => {
                  setSelectedId(null);
                  setScope("single");
                }}
                disabled={submitting}
              >
                Back
              </Button>
              <Button
                size="lg"
                fullWidth
                onClick={handleAssign}
                disabled={submitting || !targetHoldingId}
              >
                {submitting ? "Moving…" : "Move"}
              </Button>
            </div>
          </>
        ) : (
          <ul className="surface divide-y divide-border max-h-[50vh] overflow-y-auto">
            {transactions.map((t) => {
              const cat = categoriesById[t.categoryId];
              const account = accountsById[t.accountId];
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface-2 transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm text-fg truncate">
                        {t.description || cat?.name || "Investment"}
                      </span>
                      <span className="block text-xs text-fg-subtle truncate">
                        {formatDate(t.date)}
                        {account ? ` · ${account.name}` : ""}
                        {cat?.name ? ` · ${cat.name}` : ""}
                      </span>
                    </span>
                    <span className="text-sm text-fg tabular-nums shrink-0">
                      {formatCurrency(t.amount, t.currency)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
