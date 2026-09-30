"use client";

import { useCallback, useEffect, useState } from "react";
import EmptyState from "@/components/atoms/EmptyState";
import RowSkeleton from "@/components/atoms/RowSkeleton";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import { emitDataChanged, subscribeDataChanged } from "@/lib/events/dataChanged";
import {
  listTrash,
  restoreFromTrash,
  TRASH_RETENTION_DAYS,
  trashExpiresAt,
  type TrashEntry,
  type TrashKind,
} from "@/lib/firebase/trash";
import { formatCurrency } from "@/lib/utils/format";

const KIND_LABELS: Record<TrashKind, string> = {
  transaction: "Transaction",
  transfer: "Transfer",
  account: "Account",
  budget: "Budget",
  category: "Category",
  goal: "Goal",
  contribution: "Goal contribution",
  recurring: "Recurring",
  holding: "Holding",
  valuation: "Valuation",
  import: "CSV import",
};

function daysLeft(entry: TrashEntry): number {
  const ms = trashExpiresAt(entry).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default function TrashPage() {
  const [entries, setEntries] = useState<TrashEntry[] | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    () =>
      listTrash().then(setEntries, (err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Couldn't load deleted items.",
        );
        setEntries([]);
      }),
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => subscribeDataChanged(() => void refresh()), [refresh]);

  async function handleRestore(entry: TrashEntry) {
    const ownerUid = entry._owner?.uid;
    if (!ownerUid) return;
    setError(null);
    setRestoring(entry.id);
    try {
      await restoreFromTrash(ownerUid, entry.id);
      setEntries((prev) => prev?.filter((e) => e.id !== entry.id) ?? null);
      emitDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't restore that item.");
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead kicker="Settings" title="Recently deleted" />

      <p className="lede text-sm">
        Deleted items stay here for {TRASH_RETENTION_DAYS} days, then they&apos;re
        removed for good. Restoring puts an item back exactly as it was.
      </p>

      {error && <p className="text-sm text-expense">{error}</p>}

      {entries === null ? (
        <RowSkeleton />
      ) : entries.length === 0 ? (
        <EmptyState
          title="Nothing deleted."
          description="Things you delete show up here for a while in case you change your mind."
        />
      ) : (
        <ul className="rooms">
          {entries.map((entry) => {
            const left = daysLeft(entry);
            return (
              <li key={entry.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-sm text-fg truncate">{entry.label}</span>
                  <span className="text-xs text-fg-subtle">
                    {KIND_LABELS[entry.kind] ?? entry.kind}
                    {typeof entry.amount === "number" && entry.currency
                      ? ` · ${formatCurrency(entry.amount, entry.currency)}`
                      : ""}
                    {" · "}
                    {left === 0
                      ? "removed today"
                      : `${left} day${left === 1 ? "" : "s"} left`}
                    {entry._owner && entry._owner.permission !== "owner"
                      ? ` · ${entry._owner.nickname}`
                      : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestore(entry)}
                  disabled={restoring !== null}
                  className="btn btn-secondary btn-sm"
                >
                  {restoring === entry.id ? "Restoring…" : "Restore"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
