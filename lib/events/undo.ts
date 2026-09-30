import { emitDataChanged } from "@/lib/events/dataChanged";
import { auth } from "@/lib/firebase/client";
import { restoreFromTrash } from "@/lib/firebase/trash";

export interface DeletedNotice {
  message: string;
  // Trash entries to restore on undo, keyed by the subtree owner.
  entries: { ownerUid: string; trashId: string }[];
}

type Listener = (notice: DeletedNotice) => void;

const listeners = new Set<Listener>();

/** The toast host subscribes here to offer an Undo button after a delete. */
export function subscribeDeleted(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function announceDeleted(notice: DeletedNotice): void {
  if (notice.entries.length === 0) return;
  for (const fn of listeners) fn(notice);
}

export async function undoDeletion(notice: DeletedNotice): Promise<void> {
  for (const { ownerUid, trashId } of notice.entries) {
    await restoreFromTrash(ownerUid, trashId);
  }
  emitDataChanged();
}

/**
 * Convenience for hooks: pass what each store `remove` resolved to. Local
 * stores hard-delete and resolve to void, so they simply don't offer undo.
 */
export function announceRemoval(
  message: string,
  removed: { ownerUid?: string; trashId: string | void }[],
): void {
  const self = auth.currentUser?.uid;
  const entries = removed.flatMap(({ ownerUid, trashId }) => {
    const uid = ownerUid ?? self;
    return trashId && uid ? [{ ownerUid: uid, trashId }] : [];
  });
  announceDeleted({ message, entries });
}
