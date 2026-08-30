import {
  addDoc,
  deleteDoc,
  orderBy,
  query,
} from "firebase/firestore";
import {
  listAcrossOwners,
  ownerCollection,
  ownerDoc,
} from "@/lib/firebase/firestoreHelpers";
import { requireWriteUid, findOwnerCtx } from "@/lib/firebase/access";
import type { Category, NewCategory, OwnerCtx } from "@/lib/types";
import type { CategoryStore } from "@/lib/storage/CategoryStore";

const COL = "categories";

function hydrate(
  id: string,
  data: Omit<Category, "id">,
  owner: OwnerCtx,
): Category {
  return { id, ...data, _owner: owner };
}

function ownerCtxFor(uid: string): OwnerCtx {
  return findOwnerCtx(uid) ?? { uid, nickname: "You", permission: "owner" };
}

export const firebaseCategoryStore: CategoryStore = {
  async list() {
    return listAcrossOwners<Category>(
      COL,
      (id, data, owner) => hydrate(id, data as Omit<Category, "id">, owner),
      (col) => query(col, orderBy("createdAt")),
    );
  },
  async add(input: NewCategory, ownerUid?: string) {
    const uid = requireWriteUid(ownerUid);
    const createdAt = new Date().toISOString();
    const payload = { ...input, isDefault: false, createdAt };
    const ref = await addDoc(ownerCollection(uid, COL), payload);
    return { id: ref.id, ...payload, _owner: ownerCtxFor(uid) };
  },
  async remove(id, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    await deleteDoc(ownerDoc(uid, COL, id));
  },
};
