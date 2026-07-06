import { addDoc, deleteDoc, getDocs, orderBy, query } from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firebase/firestoreHelpers";
import type { Category, NewCategory } from "@/lib/types";
import type { CategoryStore } from "@/lib/storage/CategoryStore";

const COL = "categories";

export const firebaseCategoryStore: CategoryStore = {
  async list() {
    const snap = await getDocs(query(userCollection(COL), orderBy("createdAt")));
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<Category, "id">) }),
    );
  },
  async add(input: NewCategory) {
    const createdAt = new Date().toISOString();
    const payload = { ...input, isDefault: false, createdAt };
    const ref = await addDoc(userCollection(COL), payload);
    return { id: ref.id, ...payload };
  },
  async remove(id) {
    await deleteDoc(userDoc(COL, id));
  },
};
