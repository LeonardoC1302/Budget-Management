import {
  collection,
  doc,
  getDoc,
  getDocFromCache,
  getDocs,
  getDocsFromCache,
  orderBy,
  query,
  type CollectionReference,
  type DocumentReference,
  type DocumentSnapshot,
  type Query,
  type QuerySnapshot,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { getAccessibleContexts } from "@/lib/firebase/access";
import { trackPendingWrite } from "@/lib/offline/syncStatus";
import type { OwnerCtx } from "@/lib/types";

// ---------------------------------------------------------------------------
// Offline-aware reads and writes.
//
// With the persistent cache enabled, Firestore applies writes to the local
// cache immediately, but the returned promise only settles once the server
// acknowledges the write. Offline that never happens, so awaiting it would hang
// the UI. Reads have the mirror problem: `getDocs` waits for the server before
// falling back to the cache.
// ---------------------------------------------------------------------------

const SERVER_READ_TIMEOUT_MS = 4000;
const WRITE_ACK_TIMEOUT_MS = 2500;

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

class TimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function isConnectivityError(err: unknown): boolean {
  if (err instanceof TimeoutError) return true;
  const code = (err as { code?: string } | null)?.code;
  return code === "unavailable" || code === "failed-precondition";
}

/** `getDocs` that answers from the local cache when the server is unreachable. */
export async function readDocs(q: Query): Promise<QuerySnapshot> {
  if (isOffline()) return getDocsFromCache(q);
  try {
    return await withTimeout(getDocs(q), SERVER_READ_TIMEOUT_MS);
  } catch (err) {
    if (isConnectivityError(err)) return getDocsFromCache(q);
    throw err;
  }
}

/** `getDoc` counterpart of `readDocs`. Throws if offline and never cached. */
export async function readDoc(ref: DocumentReference): Promise<DocumentSnapshot> {
  if (isOffline()) return getDocFromCache(ref);
  try {
    return await withTimeout(getDoc(ref), SERVER_READ_TIMEOUT_MS);
  } catch (err) {
    if (isConnectivityError(err)) return getDocFromCache(ref);
    throw err;
  }
}

/**
 * Wait for a write only as long as it's useful. Online, rejections such as
 * permission-denied still surface to the caller. Offline, or when the server is
 * slow to ack, the write is already in the local cache and will sync on its
 * own, so the caller moves on.
 */
export async function commitWrite(write: Promise<unknown>): Promise<void> {
  trackPendingWrite(write);
  if (isOffline()) return;
  try {
    await withTimeout(write, WRITE_ACK_TIMEOUT_MS);
  } catch (err) {
    if (err instanceof TimeoutError) return;
    throw err;
  }
}

/** Read a document right after writing it. The local cache always has it. */
export async function readAfterWrite(
  ref: DocumentReference,
): Promise<DocumentSnapshot> {
  try {
    return await getDocFromCache(ref);
  } catch {
    return readDoc(ref);
  }
}

/** True for docs moved to the trash (see lib/firebase/trash.ts). */
export function isSoftDeleted(data: Record<string, unknown>): boolean {
  return typeof data.deletedAt === "string";
}

export function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("Not signed in. Firestore operations require an authenticated user.");
  }
  return uid;
}

export function userCollection(name: string): CollectionReference {
  return collection(db, "users", requireUid(), name);
}

export function userDoc(name: string, id: string): DocumentReference {
  return doc(db, "users", requireUid(), name, id);
}

// Owner-scoped variants — same shape, but the caller supplies the target uid.
// Used to route writes to a grantor's subtree without changing per-store code.
export function ownerCollection(
  ownerUid: string,
  name: string,
): CollectionReference {
  return collection(db, "users", ownerUid, name);
}

export function ownerDoc(
  ownerUid: string,
  name: string,
  id: string,
): DocumentReference {
  return doc(db, "users", ownerUid, name, id);
}

// Fans out a `getDocs` query across every accessible owner (self + grantors)
// and decorates the results with `_owner`. When the user has zero grantors
// this is exactly one round-trip — identical to the pre-connections cost.
//
// `buildQuery` receives the owner's collection ref and returns the query to
// run against it (typically `query(col, orderBy(...))`). It's a callback so
// callers can add `where` filters or `orderBy` as needed. If omitted, a plain
// `getDocs(col)` is used. Soft-deleted docs are skipped.
export async function listAcrossOwners<T>(
  collectionName: string,
  hydrate: (id: string, data: Record<string, unknown>, owner: OwnerCtx) => T,
  buildQuery?: (col: CollectionReference) => Query,
  options: { includeSoftDeleted?: boolean } = {},
): Promise<T[]> {
  const contexts = getAccessibleContexts();
  if (contexts.length === 0) return [];
  const perOwner = await Promise.all(
    contexts.map(async (owner) => {
      const col = ownerCollection(owner.uid, collectionName);
      const q = buildQuery ? buildQuery(col) : col;
      try {
        const snap = await readDocs(q);
        return snap.docs
          .filter((d) => options.includeSoftDeleted || !isSoftDeleted(d.data()))
          .map((d) =>
            hydrate(d.id, d.data() as Record<string, unknown>, owner),
          );
      } catch (err) {
        // A revoked or misconfigured grant will throw permission-denied.
        // Log but don't fail the whole list — the user's own data still loads.
        if (owner.permission !== "owner") {
          console.warn(
            `Failed to load ${collectionName} for owner ${owner.uid}:`,
            err,
          );
          return [] as T[];
        }
        throw err;
      }
    }),
  );
  return perOwner.flat();
}

// Convenience: same but with an `orderBy` field. Kept because most stores just
// need one order key.
export function orderedQuery(
  field: string,
  direction: "asc" | "desc" = "asc",
): (col: CollectionReference) => Query {
  return (col) => query(col, orderBy(field, direction));
}
