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
      { field: "createdAt" },
    );
  },
  async addGoal(input: NewGoal, ownerUid?: string) {
    const uid = requireWriteUid(ownerUid);
    const createdAt = new Date().toISOString();
    const ref = doc(ownerCollection(uid, GOALS));
    await commitWrite(setDoc(ref, { ...input, createdAt }));
    return { id: ref.id, ...input, createdAt, _owner: ownerCtxFor(uid) };
  },
  async updateGoal(id, patch, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const ref = ownerDoc(uid, GOALS, id);
    const cleaned: Partial<Goal> = { ...patch };
    delete (cleaned as { _owner?: unknown })._owner;
    await commitWrite(updateDoc(ref, cleaned));
    const snap = await readAfterWrite(ref);
    if (!snap.exists()) throw new Error(`Goal ${id} not found`);
    return hydrateGoal(
      snap.id,
      snap.data() as Omit<Goal, "id">,
      ownerCtxFor(uid),
    );
  },
  async removeGoal(id, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const goalSnap = await readDoc(ownerDoc(uid, GOALS, id));
    const goal = goalSnap.data() as Partial<Goal> | undefined;
    // Contributions already in the trash keep their own entry, so restoring
    // the goal doesn't bring back ones deleted separately.
    const contribSnap = await readDocs(
      query(ownerCollection(uid, CONTRIBUTIONS), where("goalId", "==", id)),
    );
    return softDelete(uid, {
      kind: "goal",
      label: goal?.name || "Goal",
      refs: [
        { col: GOALS, id },
        ...contribSnap.docs
          .filter((c) => !isSoftDeleted(c.data()))
          .map((c) => ({ col: CONTRIBUTIONS, id: c.id })),
      ],
      amount: goal?.targetAmount,
      currency: goal?.currency,
    });
  },

  async listContributions() {
    return listAcrossOwners<GoalContribution>(
      CONTRIBUTIONS,
      (id, data, owner) =>
        hydrateContribution(id, data as Omit<GoalContribution, "id">, owner),
      { field: "date", direction: "desc" },
    );
  },
  async addContribution(input: NewGoalContribution, ownerUid?: string) {
    const uid = requireWriteUid(ownerUid);
    const createdAt = new Date().toISOString();
    const ref = doc(ownerCollection(uid, CONTRIBUTIONS));
    await commitWrite(setDoc(ref, { ...input, createdAt }));
    return { id: ref.id, ...input, createdAt, _owner: ownerCtxFor(uid) };
  },
  async removeContribution(id, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const snap = await readDoc(ownerDoc(uid, CONTRIBUTIONS, id));
    const data = snap.data() as Partial<GoalContribution> | undefined;
    return softDelete(uid, {
      kind: "contribution",
      label: data?.note || "Goal contribution",
      refs: [{ col: CONTRIBUTIONS, id }],
      amount: data?.amount,
    });
  },
};
