import {
  doc,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  commitWrite,
  isSoftDeleted,
  listAcrossOwners,
  ownerCollection,
  ownerDoc,
  readAfterWrite,
  readDoc,
  readDocs,
} from "@/lib/firebase/firestoreHelpers";
import { softDelete } from "@/lib/firebase/trash";
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
      { field: "createdAt" },
    );
  },
  async addHolding(input, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const createdAt = new Date().toISOString();
    const payload = stripUndefined({ ...input, createdAt });
    const ref = doc(ownerCollection(uid, HOLDINGS));
    await commitWrite(setDoc(ref, payload));
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
    await commitWrite(updateDoc(ref, cleaned));
    const snap = await readAfterWrite(ref);
    if (!snap.exists()) throw new Error(`Holding ${id} not found`);
    return hydrateHolding(
      snap.id,
      snap.data() as Omit<Holding, "id">,
      ownerCtxFor(uid),
    );
  },
  async removeHolding(id, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const holdingSnap = await readDoc(ownerDoc(uid, HOLDINGS, id));
    const holding = holdingSnap.data() as Partial<Holding> | undefined;
    const valSnap = await readDocs(
      query(ownerCollection(uid, VALUATIONS), where("holdingId", "==", id)),
    );
    return softDelete(uid, {
      kind: "holding",
      label: holding?.name || "Holding",
      refs: [
        { col: HOLDINGS, id },
        ...valSnap.docs
          .filter((v) => !isSoftDeleted(v.data()))
          .map((v) => ({ col: VALUATIONS, id: v.id })),
      ],
    });
  },

  async listValuations() {
    return listAcrossOwners<HoldingValuation>(
      VALUATIONS,
      (id, data, owner) =>
        hydrateValuation(id, data as Omit<HoldingValuation, "id">, owner),
      { field: "asOfDate", direction: "desc" },
    );
  },
  async addValuation(input, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const createdAt = new Date().toISOString();
    const payload = stripUndefined({ ...input, createdAt });
    const ref = doc(ownerCollection(uid, VALUATIONS));
    await commitWrite(setDoc(ref, payload));
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
    await commitWrite(updateDoc(ref, cleaned));
    const snap = await readAfterWrite(ref);
    if (!snap.exists()) throw new Error(`Valuation ${id} not found`);
    return hydrateValuation(
      snap.id,
      snap.data() as Omit<HoldingValuation, "id">,
      ownerCtxFor(uid),
    );
  },
  async removeValuation(id, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const snap = await readDoc(ownerDoc(uid, VALUATIONS, id));
    const data = snap.data() as Partial<HoldingValuation> | undefined;
    return softDelete(uid, {
      kind: "valuation",
      label: data?.note || "Valuation",
      refs: [{ col: VALUATIONS, id }],
      amount: data?.valueUSD,
      currency: "USD",
    });
  },
};
