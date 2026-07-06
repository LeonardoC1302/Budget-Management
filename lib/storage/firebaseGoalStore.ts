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
  Goal,
  GoalContribution,
  NewGoal,
  NewGoalContribution,
} from "@/lib/types";
import type { GoalStore } from "@/lib/storage/GoalStore";

const GOALS = "goals";
const CONTRIBUTIONS = "goalContributions";

export const firebaseGoalStore: GoalStore = {
  async listGoals() {
    const snap = await getDocs(query(userCollection(GOALS), orderBy("createdAt")));
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<Goal, "id">) }),
    );
  },
  async addGoal(input: NewGoal) {
    const createdAt = new Date().toISOString();
    const ref = await addDoc(userCollection(GOALS), { ...input, createdAt });
    return { id: ref.id, ...input, createdAt };
  },
  async updateGoal(id, patch) {
    const ref = userDoc(GOALS, id);
    await updateDoc(ref, patch);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Goal ${id} not found`);
    return { id: snap.id, ...(snap.data() as Omit<Goal, "id">) };
  },
  async removeGoal(id) {
    const batch = writeBatch(db);
    batch.delete(userDoc(GOALS, id));
    const contribSnap = await getDocs(
      query(userCollection(CONTRIBUTIONS), where("goalId", "==", id)),
    );
    for (const c of contribSnap.docs) batch.delete(c.ref);
    await batch.commit();
  },

  async listContributions() {
    const snap = await getDocs(
      query(userCollection(CONTRIBUTIONS), orderBy("date", "desc")),
    );
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<GoalContribution, "id">) }),
    );
  },
  async addContribution(input: NewGoalContribution) {
    const createdAt = new Date().toISOString();
    const ref = await addDoc(userCollection(CONTRIBUTIONS), { ...input, createdAt });
    return { id: ref.id, ...input, createdAt };
  },
  async removeContribution(id) {
    await deleteDoc(userDoc(CONTRIBUTIONS, id));
  },
};
