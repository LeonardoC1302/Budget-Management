import {
  deleteDoc,
  deleteField,
  doc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import {
  commitWrite,
  isOffline,
  listAcrossOwners,
  ownerCollection,
  ownerDoc,
  readDoc,
  readDocs,
} from "@/lib/firebase/firestoreHelpers";
import type { OwnerCtx } from "@/lib/types";

// Soft delete. Deleting marks each affected doc with `deletedAt` + `trashId`
// and writes one `trash/{trashId}` entry listing exactly which docs it marked,
// so a restore flips back the same set (e.g. both legs of a transfer, or a goal
// with its contributions). Every list read skips marked docs. Docs written
// before this feature have no `deletedAt`, so they read as live — no migration.
// Entries older than TRASH_RETENTION_DAYS are purged for good.

export const TRASH_COL = "trash";
export const TRASH_RETENTION_DAYS = 30;
const BATCH_LIMIT = 450;

export type TrashKind =
  | "transaction"
  | "transfer"
  | "account"
  | "budget"
  | "category"
  | "goal"
  | "contribution"
  | "recurring"
  | "holding"
  | "valuation"
  | "import";

export interface TrashRef {
  col: string;
  id: string;
}

export interface TrashEntry {
  id: string;
  kind: TrashKind;
  label: string;
  deletedAt: string;
  refs: TrashRef[];
  amount?: number;
  currency?: string;
  _owner?: OwnerCtx;
}

export interface SoftDeleteInput {
  kind: TrashKind;
  label: string;
  refs: TrashRef[];
  amount?: number;
  currency?: string;
}

/** Marks `refs` as deleted under `ownerUid` and returns the trash entry id. */
export async function softDelete(
  ownerUid: string,
  input: SoftDeleteInput,
): Promise<string> {
  const trashRef = doc(ownerCollection(ownerUid, TRASH_COL));
  const deletedAt = new Date().toISOString();
  // Large sets (an undone import) exceed Firestore's 500-write batch cap.
  // Earlier chunks commit first; the trash entry rides in the last one.
  const chunks: TrashRef[][] = [];
  for (let i = 0; i < input.refs.length; i += BATCH_LIMIT) {
    chunks.push(input.refs.slice(i, i + BATCH_LIMIT));
  }
  for (const chunk of chunks.slice(0, -1)) {
    const early = writeBatch(db);
    for (const ref of chunk) {
      early.update(ownerDoc(ownerUid, ref.col, ref.id), {
        deletedAt,
        trashId: trashRef.id,
      });
    }
    await commitWrite(early.commit());
  }
  const batch = writeBatch(db);
  for (const ref of chunks[chunks.length - 1] ?? []) {
    batch.update(ownerDoc(ownerUid, ref.col, ref.id), {
      deletedAt,
      trashId: trashRef.id,
    });
  }
  const entry: Omit<TrashEntry, "id" | "_owner"> = {
    kind: input.kind,
    label: input.label,
    deletedAt,
    refs: input.refs,
  };
  if (typeof input.amount === "number") entry.amount = input.amount;
  if (input.currency) entry.currency = input.currency;
  batch.set(trashRef, entry);
  await commitWrite(batch.commit());
  return trashRef.id;
}

export async function restoreFromTrash(
  ownerUid: string,
  trashId: string,
): Promise<void> {
  const trashRef = ownerDoc(ownerUid, TRASH_COL, trashId);
  const snap = await readDoc(trashRef);
  if (!snap.exists()) return;
  const entry = snap.data() as Omit<TrashEntry, "id">;
  const refs = entry.refs ?? [];
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const ref of refs.slice(i, i + BATCH_LIMIT)) {
      batch.update(ownerDoc(ownerUid, ref.col, ref.id), {
        deletedAt: deleteField(),
        trashId: deleteField(),
      });
    }
    await commitWrite(batch.commit());
  }
  // The entry goes last so a half-finished restore can be retried.
  await commitWrite(deleteDoc(trashRef));
}

export async function listTrash(): Promise<TrashEntry[]> {
  const entries = await listAcrossOwners<TrashEntry>(
    TRASH_COL,
    (id, data, owner) => ({
      ...(data as Omit<TrashEntry, "id">),
      id,
      _owner: owner,
    }),
    undefined,
    // Trash entries carry `deletedAt` themselves; don't filter them out.
    { includeSoftDeleted: true },
  );
  return entries.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}

export function trashExpiresAt(entry: Pick<TrashEntry, "deletedAt">): Date {
  const d = new Date(entry.deletedAt);
  d.setDate(d.getDate() + TRASH_RETENTION_DAYS);
  return d;
}

/**
 * Permanently removes the signed-in user's trash entries older than the
 * retention window, along with the docs they marked. Runs online only so it
 * never races a restore queued on another device. A doc is only removed if it
 * still carries this entry's `trashId` — a doc restored and deleted again
 * belongs to a newer entry and is left alone.
 */
export async function purgeExpiredTrash(): Promise<number> {
  const uid = auth.currentUser?.uid;
  if (!uid || isOffline()) return 0;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRASH_RETENTION_DAYS);
  const expired = await readDocs(
    query(
      ownerCollection(uid, TRASH_COL),
      where("deletedAt", "<", cutoff.toISOString()),
    ),
  );
  let purged = 0;
  for (const entrySnap of expired.docs) {
    const entry = entrySnap.data() as Omit<TrashEntry, "id">;
    const deletes = [];
    for (const ref of entry.refs ?? []) {
      const target = ownerDoc(uid, ref.col, ref.id);
      const snap = await readDoc(target).catch(() => null);
      if (snap?.exists() && snap.data().trashId === entrySnap.id) {
        deletes.push(target);
      }
    }
    deletes.push(entrySnap.ref);
    for (let i = 0; i < deletes.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      for (const ref of deletes.slice(i, i + BATCH_LIMIT)) batch.delete(ref);
      await commitWrite(batch.commit());
    }
    purged += 1;
  }
  return purged;
}
