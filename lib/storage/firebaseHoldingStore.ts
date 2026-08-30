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
import {
  listAcrossOwners,
  ownerCollection,
  ownerDoc,
} from "@/lib/firebase/firestoreHelpers";
import { requireWriteUid, findOwnerCtx } from "@/lib/firebase/access";
import type {
  Holding,
  HoldingValuation,
  OwnerCtx,
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

function hydrateHolding(
  id: string,
  data: Omit<Holding, "id">,
  owner: OwnerCtx,
): Holding {
  return { id, ...data, _owner: owner };
}

function hydrateValuation(
  id: string,
  data: Omit<HoldingValuation, "id">,
  owner: OwnerCtx,
): HoldingValuation {
  return { id, ...data, _owner: owner };
}

function ownerCtxFor(uid: string): OwnerCtx {
  return findOwnerCtx(uid) ?? { uid, nickname: "You", permission: "owner" };
}

export const firebaseHoldingStore: HoldingStore = {
  async listHoldings() {
    return listAcrossOwners<Holding>(
      HOLDINGS,
      (id, data, owner) =>
        hydrateHolding(id, data as Omit<Holding, "id">, owner),
      (col) => query(col, orderBy("createdAt")),
    );
  },
  async addHolding(input, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const createdAt = new Date().toISOString();
    const payload = stripUndefined({ ...input, createdAt });
    const ref = await addDoc(ownerCollection(uid, HOLDINGS), payload);
    return {
      id: ref.id,
      ...payload,
      _owner: ownerCtxFor(uid),
    } as Holding;
  },
  async updateHolding(id, patch, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const ref = ownerDoc(uid, HOLDINGS, id);
    const cleaned = stripUndefined({ ...patch }) as Record<string, unknown>;
    delete cleaned._owner;
    await updateDoc(ref, cleaned);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Holding ${id} not found`);
    return hydrateHolding(
      snap.id,
      snap.data() as Omit<Holding, "id">,
      ownerCtxFor(uid),
    );
  },
  async removeHolding(id, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const batch = writeBatch(db);
    batch.delete(ownerDoc(uid, HOLDINGS, id));
    const valSnap = await getDocs(
      query(ownerCollection(uid, VALUATIONS), where("holdingId", "==", id)),
    );
    for (const v of valSnap.docs) batch.delete(v.ref);
    await batch.commit();
  },

  async listValuations() {
    return listAcrossOwners<HoldingValuation>(
      VALUATIONS,
      (id, data, owner) =>
        hydrateValuation(id, data as Omit<HoldingValuation, "id">, owner),
      (col) => query(col, orderBy("asOfDate", "desc")),
    );
  },
  async addValuation(input, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const createdAt = new Date().toISOString();
    const payload = stripUndefined({ ...input, createdAt });
    const ref = await addDoc(ownerCollection(uid, VALUATIONS), payload);
    return {
      id: ref.id,
      ...payload,
      _owner: ownerCtxFor(uid),
    } as HoldingValuation;
  },
  async updateValuation(id, patch, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const ref = ownerDoc(uid, VALUATIONS, id);
    const cleaned = stripUndefined({ ...patch }) as Record<string, unknown>;
    delete cleaned._owner;
    await updateDoc(ref, cleaned);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Valuation ${id} not found`);
    return hydrateValuation(
      snap.id,
      snap.data() as Omit<HoldingValuation, "id">,
      ownerCtxFor(uid),
    );
  },
  async removeValuation(id, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    await deleteDoc(ownerDoc(uid, VALUATIONS, id));
  },
};
