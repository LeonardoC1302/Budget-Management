import {
  addDoc,
  deleteDoc,
  getDoc,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  listAcrossOwners,
  ownerCollection,
  ownerDoc,
} from "@/lib/firebase/firestoreHelpers";
import { requireWriteUid, findOwnerCtx } from "@/lib/firebase/access";
import type {
  NewRecurringTransaction,
  OwnerCtx,
  RecurringTransaction,
} from "@/lib/types";
import type { RecurringTransactionStore } from "@/lib/storage/RecurringTransactionStore";

const COL = "recurringTransactions";

function stripUndefined<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}

function hydrate(
  id: string,
  data: Omit<RecurringTransaction, "id">,
  owner: OwnerCtx,
): RecurringTransaction {
  return { id, ...data, _owner: owner };
}

function ownerCtxFor(uid: string): OwnerCtx {
  return findOwnerCtx(uid) ?? { uid, nickname: "You", permission: "owner" };
}

export const firebaseRecurringTransactionStore: RecurringTransactionStore = {
  async list() {
    return listAcrossOwners<RecurringTransaction>(
      COL,
      (id, data, owner) =>
        hydrate(id, data as Omit<RecurringTransaction, "id">, owner),
      (col) => query(col, orderBy("createdAt", "desc")),
    );
  },
  async add(input: NewRecurringTransaction, ownerUid?: string) {
    const uid = requireWriteUid(ownerUid);
    const createdAt = new Date().toISOString();
    const payload = stripUndefined({ ...input, createdAt });
    const ref = await addDoc(ownerCollection(uid, COL), payload);
    return {
      id: ref.id,
      ...(payload as Omit<RecurringTransaction, "id">),
      _owner: ownerCtxFor(uid),
    };
  },
  async update(id, patch, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const ref = ownerDoc(uid, COL, id);
    const cleaned = stripUndefined(patch) as Record<string, unknown>;
    delete cleaned._owner;
    await updateDoc(ref, cleaned);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Recurring template ${id} not found`);
    return hydrate(
      snap.id,
      snap.data() as Omit<RecurringTransaction, "id">,
      ownerCtxFor(uid),
    );
  },
  async remove(id, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    await deleteDoc(ownerDoc(uid, COL, id));
  },
  async updateLastGeneratedDates(updates) {
    if (updates.length === 0) return;
    // Updates can span multiple owners; group by ownerUid and use one batch per
    // owner subtree so writes stay within a single subcollection reference.
    const byOwner = new Map<string, typeof updates>();
    for (const u of updates) {
      const uid = requireWriteUid(u.ownerUid);
      const bucket = byOwner.get(uid) ?? [];
      bucket.push(u);
      byOwner.set(uid, bucket);
    }
    for (const [uid, group] of byOwner) {
      const batch = writeBatch(db);
      for (const u of group) {
        batch.update(ownerDoc(uid, COL, u.id), {
          lastGeneratedDate: u.lastGeneratedDate,
        });
      }
      await batch.commit();
    }
  },
};
