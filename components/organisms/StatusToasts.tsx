"use client";

import { useEffect, useRef, useState } from "react";
import { useOfflineSyncDriver, useSyncState } from "@/hooks/useOfflineSync";
import {
  subscribeDeleted,
  undoDeletion,
  type DeletedNotice,
} from "@/lib/events/undo";
import { cn } from "@/lib/utils/cn";

const UNDO_WINDOW_MS = 6000;

/**
 * Bottom-anchored status line above the nav: the Undo offer after a delete,
 * and the offline / syncing state. Undo wins while it's showing; the sync
 * line returns once it closes.
 */
export default function StatusToasts() {
  useOfflineSyncDriver();
  const sync = useSyncState();
  const [notice, setNotice] = useState<DeletedNotice | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () =>
      subscribeDeleted((next) => {
        if (timer.current) clearTimeout(timer.current);
        setUndoError(null);
        setNotice(next);
        timer.current = setTimeout(() => setNotice(null), UNDO_WINDOW_MS);
      }),
    [],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function handleUndo() {
    if (!notice) return;
    if (timer.current) clearTimeout(timer.current);
    setUndoing(true);
    try {
      await undoDeletion(notice);
      setNotice(null);
    } catch (err) {
      setUndoError(
        err instanceof Error ? err.message : "Couldn't restore. Try Recently deleted.",
      );
      timer.current = setTimeout(() => setNotice(null), UNDO_WINDOW_MS);
    } finally {
      setUndoing(false);
    }
  }

  const unsynced = sync.pendingWrites > 0 || sync.queuedFromEarlier;
  const syncLine = !sync.online
    ? unsynced && sync.pendingWrites > 0
      ? `Offline · ${sync.pendingWrites} change${sync.pendingWrites === 1 ? "" : "s"} saved on this device`
      : "Offline · changes are saved on this device"
    : unsynced
      ? "Syncing changes…"
      : null;

  if (!notice && !syncLine) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 pointer-events-none"
      aria-live="polite"
    >
      {notice ? (
        <div
          role="status"
          className={cn(
            "surface pointer-events-auto flex items-center gap-4",
            "px-4 py-2.5 text-sm shadow-lg max-w-sm w-full",
          )}
        >
          <span className="flex-1 min-w-0 truncate">
            {undoError ?? notice.message}
          </span>
          {!undoError && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoing}
              className="font-medium text-accent hover:text-accent-hover disabled:opacity-60"
            >
              {undoing ? "Restoring…" : "Undo"}
            </button>
          )}
        </div>
      ) : (
        <div
          role="status"
          className="surface-2 pointer-events-auto flex items-center gap-2 px-3 py-1.5 text-xs text-fg-muted"
        >
          <span
            aria-hidden
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              sync.online ? "bg-accent animate-pulse" : "bg-fg-subtle",
            )}
          />
          {syncLine}
        </div>
      )}
    </div>
  );
}
