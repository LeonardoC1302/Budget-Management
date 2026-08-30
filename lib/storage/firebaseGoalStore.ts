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
  Goal,
  GoalContribution,
  NewGoal,
  NewGoalContribution,
  OwnerCtx,
} from "@/lib/types";
import type { GoalStore } from "@/lib/storage/GoalStore";

const GOALS = "goals";
const CONTRIBUTIONS = "goalContributions";

function hydrateGoal(
  id: string,
  data: Omit<Goal, "id">,
  owner: OwnerCtx,
): Goal {
  return { id, ...data, _owner: owner };
}

function hydrateContribution(
  id: string,
  data: Omit<GoalContribution, "id">,
  owner: OwnerCtx,
): GoalContribution {
  return { id, ...data, _owner: owner };
}

function ownerCtxFor(uid: string): OwnerCtx {
  return findOwnerCtx(uid) ?? { uid, nickname: "You", permission: "owner" };
}

export const firebaseGoalStore: GoalStore = {
  async listGoals() {
    return listAcrossOwners<Goal>(
      GOALS,
      (id, data, owner) => hydrateGoal(id, data as Omit<Goal, "id">, owner),
      (col) => query(col, orderBy("createdAt")),
    );
  },
  async addGoal(input: NewGoal, ownerUid?: string) {
    const uid = requireWriteUid(ownerUid);
    const createdAt = new Date().toISOString();
    const ref = await addDoc(ownerCollection(uid, GOALS), {
      ...input,
      createdAt,
    });
    return { id: ref.id, ...input, createdAt, _owner: ownerCtxFor(uid) };
  },
  async updateGoal(id, patch, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const ref = ownerDoc(uid, GOALS, id);
    const cleaned: Partial<Goal> = { ...patch };
    delete (cleaned as { _owner?: unknown })._owner;
    await updateDoc(ref, cleaned);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Goal ${id} not found`);
    return hydrateGoal(
      snap.id,
      snap.data() as Omit<Goal, "id">,
      ownerCtxFor(uid),
    );
  },
  async removeGoal(id, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const batch = writeBatch(db);
    batch.delete(ownerDoc(uid, GOALS, id));
    const contribSnap = await getDocs(
      query(ownerCollection(uid, CONTRIBUTIONS), where("goalId", "==", id)),
    );
    for (const c of contribSnap.docs) batch.delete(c.ref);
    await batch.commit();
  },

  async listContributions() {
    return listAcrossOwners<GoalContribution>(
      CONTRIBUTIONS,
      (id, data, owner) =>
        hydrateContribution(id, data as Omit<GoalContribution, "id">, owner),
      (col) => query(col, orderBy("date", "desc")),
    );
  },
  async addContribution(input: NewGoalContribution, ownerUid?: string) {
    const uid = requireWriteUid(ownerUid);
    const createdAt = new Date().toISOString();
    const ref = await addDoc(ownerCollection(uid, CONTRIBUTIONS), {
      ...input,
      createdAt,
    });
    return { id: ref.id, ...input, createdAt, _owner: ownerCtxFor(uid) };
  },
  async removeContribution(id, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    await deleteDoc(ownerDoc(uid, CONTRIBUTIONS, id));
  },
};
