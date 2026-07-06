import { addDoc, deleteDoc, getDocs, orderBy, query } from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firebase/firestoreHelpers";
import type { NewTransaction, Transaction } from "@/lib/types";
import type { TransactionStore } from "@/lib/storage/TransactionStore";

const COL = "transactions";

export const firebaseTransactionStore: TransactionStore = {
  async list() {
    const snap = await getDocs(query(userCollection(COL), orderBy("date", "desc")));
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<Transaction, "id">) }),
    );
  },
  async add(input: NewTransaction) {
    const createdAt = new Date().toISOString();
    const ref = await addDoc(userCollection(COL), { ...input, createdAt });
    return { id: ref.id, ...input, createdAt };
  },
  async remove(id) {
    await deleteDoc(userDoc(COL, id));
  },
};
