import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { userCollection, userDoc } from "@/lib/firebase/firestoreHelpers";
import type {
  NewRecurringTransaction,
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

export const firebaseRecurringTransactionStore: RecurringTransactionStore = {
  async list() {
    const snap = await getDocs(
      query(userCollection(COL), orderBy("createdAt", "desc")),
    );
    return snap.docs.map(
      (d) =>
        ({ id: d.id, ...(d.data() as Omit<RecurringTransaction, "id">) }) as RecurringTransaction,
    );
  },
  async add(input: NewRecurringTransaction) {
    const createdAt = new Date().toISOString();
    const payload = stripUndefined({ ...input, createdAt });
    const ref = await addDoc(userCollection(COL), payload);
    return { id: ref.id, ...(payload as Omit<RecurringTransaction, "id">) };
  },
  async update(id, patch) {
    const ref = userDoc(COL, id);
    await updateDoc(ref, stripUndefined(patch));
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Recurring template ${id} not found`);
    return { id: snap.id, ...(snap.data() as Omit<RecurringTransaction, "id">) };
  },
  async remove(id) {
    await deleteDoc(userDoc(COL, id));
  },
  async updateLastGeneratedDates(updates) {
    if (updates.length === 0) return;
    const batch = writeBatch(db);
    for (const u of updates) {
      batch.update(userDoc(COL, u.id), { lastGeneratedDate: u.lastGeneratedDate });
    }
    await batch.commit();
  },
};
