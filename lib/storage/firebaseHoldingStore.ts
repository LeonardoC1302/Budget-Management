import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { userCollection, userDoc } from "@/lib/firebase/firestoreHelpers";
import type {
  Holding,
  HoldingValuation,
} from "@/lib/types";
import type { HoldingStore } from "@/lib/storage/HoldingStore";

const HOLDINGS = "holdings";
const VALUATIONS = "holdingValuations";

function stripUndefined<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}

export const firebaseHoldingStore: HoldingStore = {
  async listHoldings() {
    const snap = await getDocs(
      query(userCollection(HOLDINGS), orderBy("createdAt")),
    );
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<Holding, "id">) }),
    );
  },
  async addHolding(input) {
    const createdAt = new Date().toISOString();
    const payload = stripUndefined({ ...input, createdAt });
    const ref = await addDoc(userCollection(HOLDINGS), payload);
    return { id: ref.id, ...payload } as Holding;
  },
  async updateHolding(id, patch) {
    const ref = userDoc(HOLDINGS, id);
    await updateDoc(ref, stripUndefined({ ...patch }));
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Holding ${id} not found`);
    return { id: snap.id, ...(snap.data() as Omit<Holding, "id">) };
  },
  async removeHolding(id) {
    const batch = writeBatch(db);
    batch.delete(userDoc(HOLDINGS, id));
    const valSnap = await getDocs(
      query(userCollection(VALUATIONS), where("holdingId", "==", id)),
    );
    for (const v of valSnap.docs) batch.delete(v.ref);
    await batch.commit();
  },

  async listValuations() {
    const snap = await getDocs(
      query(userCollection(VALUATIONS), orderBy("asOfDate", "desc")),
    );
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<HoldingValuation, "id">) }),
    );
  },
  async addValuation(input) {
    const createdAt = new Date().toISOString();
    const payload = stripUndefined({ ...input, createdAt });
    const ref = await addDoc(userCollection(VALUATIONS), payload);
    return { id: ref.id, ...payload } as HoldingValuation;
  },
  async updateValuation(id, patch) {
    const ref = userDoc(VALUATIONS, id);
    await updateDoc(ref, stripUndefined({ ...patch }));
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Valuation ${id} not found`);
    return {
      id: snap.id,
      ...(snap.data() as Omit<HoldingValuation, "id">),
    };
  },
  async removeValuation(id) {
    await deleteDoc(userDoc(VALUATIONS, id));
  },
};
