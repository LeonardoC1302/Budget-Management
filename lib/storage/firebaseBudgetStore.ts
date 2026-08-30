import {
  addDoc,
  deleteDoc,
  getDoc,
  orderBy,
  query,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import {
  listAcrossOwners,
  ownerCollection,
  ownerDoc,
} from "@/lib/firebase/firestoreHelpers";
import { requireWriteUid, findOwnerCtx } from "@/lib/firebase/access";
import type { Budget, NewBudget, OwnerCtx } from "@/lib/types";
import type { BudgetStore } from "@/lib/storage/BudgetStore";

const COL = "budgets";

function hydrate(
  id: string,
  data: Omit<Budget, "id">,
  owner: OwnerCtx,
): Budget {
  return { id, ...data, _owner: owner };
}

function ownerCtxFor(uid: string): OwnerCtx {
  return findOwnerCtx(uid) ?? { uid, nickname: "You", permission: "owner" };
}

export const firebaseBudgetStore: BudgetStore = {
  async list() {
    return listAcrossOwners<Budget>(
      COL,
      (id, data, owner) => hydrate(id, data as Omit<Budget, "id">, owner),
      (col) => query(col, orderBy("createdAt")),
    );
  },
  async add(input: NewBudget, ownerUid?: string) {
    const uid = requireWriteUid(ownerUid);
    const existing = await getDocs(ownerCollection(uid, COL));
    if (
      existing.docs.some(
        (d) => (d.data() as Budget).categoryId === input.categoryId,
      )
    ) {
      throw new Error("A budget for this category already exists.");
    }
    const createdAt = new Date().toISOString();
    const ref = await addDoc(ownerCollection(uid, COL), {
      ...input,
      createdAt,
    });
    return { id: ref.id, ...input, createdAt, _owner: ownerCtxFor(uid) };
  },
  async update(id, patch, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const ref = ownerDoc(uid, COL, id);
    const cleaned: Partial<Budget> = { ...patch };
    delete (cleaned as { _owner?: unknown })._owner;
    await updateDoc(ref, cleaned);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Budget ${id} not found`);
    return hydrate(snap.id, snap.data() as Omit<Budget, "id">, ownerCtxFor(uid));
  },
  async remove(id, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    await deleteDoc(ownerDoc(uid, COL, id));
  },
};
