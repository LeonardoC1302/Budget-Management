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
    const all = await listAcrossOwners<Category>(
      COL,
      (id, data, owner) => hydrate(id, data as Omit<Category, "id">, owner),
      (col) => query(col, orderBy("createdAt")),
    );
    // Default categories have fixed ids (`cat-food`, ...) that collide across
    // owners' subtrees, so they'd appear once per accessible owner. Dedupe by
    // id — self is listed first in `getAccessibleContexts`, so the viewer's
    // own copy wins. Custom categories get random Firestore ids and pass
    // through untouched.
    const seen = new Set<string>();
    return all.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
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
