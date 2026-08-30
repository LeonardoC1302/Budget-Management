import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  type CollectionReference,
  type DocumentReference,
  type Query,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { getAccessibleContexts } from "@/lib/firebase/access";
import type { OwnerCtx } from "@/lib/types";

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
// `getDocs(col)` is used.
export async function listAcrossOwners<T>(
  collectionName: string,
  hydrate: (id: string, data: Record<string, unknown>, owner: OwnerCtx) => T,
  buildQuery?: (col: CollectionReference) => Query,
): Promise<T[]> {
  const contexts = getAccessibleContexts();
  if (contexts.length === 0) return [];
  const perOwner = await Promise.all(
    contexts.map(async (owner) => {
      const col = ownerCollection(owner.uid, collectionName);
      const q = buildQuery ? buildQuery(col) : col;
      try {
        const snap = await getDocs(q);
        return snap.docs.map((d) =>
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
