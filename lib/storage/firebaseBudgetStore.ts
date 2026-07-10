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
import type { Budget, NewBudget } from "@/lib/types";
import type { BudgetStore } from "@/lib/storage/BudgetStore";

const COL = "budgets";

export const firebaseBudgetStore: BudgetStore = {
  async list() {
    const snap = await getDocs(query(userCollection(COL), orderBy("createdAt")));
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<Budget, "id">) }),
    );
  },
  async add(input: NewBudget) {
    const existing = await getDocs(userCollection(COL));
    if (existing.docs.some((d) => (d.data() as Budget).categoryId === input.categoryId)) {
      throw new Error("A budget for this category already exists.");
    }
    const createdAt = new Date().toISOString();
    const ref = await addDoc(userCollection(COL), { ...input, createdAt });
    return { id: ref.id, ...input, createdAt };
  },
  async update(id, patch) {
    const ref = userDoc(COL, id);
    await updateDoc(ref, patch);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Budget ${id} not found`);
    return { id: snap.id, ...(snap.data() as Omit<Budget, "id">) };
  },
  async remove(id) {
    await deleteDoc(userDoc(COL, id));
  },
};
