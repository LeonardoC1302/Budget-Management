import {
  doc,
  orderBy,
  query,
  setDoc,
  updateDoc,
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
    const existing = await readDocs(ownerCollection(uid, COL));
    if (
      existing.docs.some(
        (d) =>
          !isSoftDeleted(d.data()) &&
          (d.data() as Budget).categoryId === input.categoryId,
      )
    ) {
      throw new Error("A budget for this category already exists.");
    }
    const createdAt = new Date().toISOString();
    const ref = doc(ownerCollection(uid, COL));
    await commitWrite(setDoc(ref, { ...input, createdAt }));
    return { id: ref.id, ...input, createdAt, _owner: ownerCtxFor(uid) };
  },
  async update(id, patch, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const ref = ownerDoc(uid, COL, id);
    const cleaned: Partial<Budget> = { ...patch };
    delete (cleaned as { _owner?: unknown })._owner;
    await commitWrite(updateDoc(ref, cleaned));
    const snap = await readAfterWrite(ref);
    if (!snap.exists()) throw new Error(`Budget ${id} not found`);
    return hydrate(snap.id, snap.data() as Omit<Budget, "id">, ownerCtxFor(uid));
  },
  async remove(id, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const snap = await readDoc(ownerDoc(uid, COL, id));
    const data = snap.data() as Partial<Budget> | undefined;
    return softDelete(uid, {
      kind: "budget",
      label: "Budget",
      refs: [{ col: COL, id }],
      amount: data?.amount,
      currency: data?.currency,
    });
  },
};
