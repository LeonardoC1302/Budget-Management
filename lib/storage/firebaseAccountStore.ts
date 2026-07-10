import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firebase/firestoreHelpers";
import type { Account, NewAccount } from "@/lib/types";
import type { AccountStore } from "@/lib/storage/AccountStore";

const COL = "accounts";

export const firebaseAccountStore: AccountStore = {
  async list() {
    const snap = await getDocs(query(userCollection(COL), orderBy("createdAt")));
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<Account, "id">) }),
    );
  },
  async add(input: NewAccount) {
    const createdAt = new Date().toISOString();
    const ref = await addDoc(userCollection(COL), { ...input, createdAt });
    return { id: ref.id, ...input, createdAt };
  },
  async update(id, patch) {
    const ref = userDoc(COL, id);
    await updateDoc(ref, patch);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Account ${id} not found`);
    return { id: snap.id, ...(snap.data() as Omit<Account, "id">) };
  },
  async remove(id) {
    await deleteDoc(userDoc(COL, id));
  },
};
