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
import { getRate } from "@/lib/services/exchangeRates";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import type { Account, NewAccount } from "@/lib/types";
import type { AccountStore } from "@/lib/storage/AccountStore";

const COL = "accounts";

function hydrate(id: string, data: Omit<Account, "id">): Account {
  const currency = data.currency ?? BASE_CURRENCY;
  const initialBalanceUSD =
    typeof data.initialBalanceUSD === "number"
      ? data.initialBalanceUSD
      : data.initialBalance;
  const creditLimitUSD =
    typeof data.creditLimit === "number" &&
    typeof data.creditLimitUSD !== "number"
      ? data.creditLimit
      : data.creditLimitUSD;
  return { ...data, id, currency, initialBalanceUSD, creditLimitUSD };
}

function stripUndefined<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}

export const firebaseAccountStore: AccountStore = {
  async list() {
    const snap = await getDocs(query(userCollection(COL), orderBy("createdAt")));
    return snap.docs.map((d) => hydrate(d.id, d.data() as Omit<Account, "id">));
  },
  async add(input: NewAccount) {
    const createdAt = new Date().toISOString();
    const rate = await getRate(input.currency, BASE_CURRENCY);
    const initialBalanceUSD = input.initialBalance * rate;
    const creditLimitUSD =
      typeof input.creditLimit === "number"
        ? input.creditLimit * rate
        : undefined;
    const account = stripUndefined({
      ...input,
      initialBalanceUSD,
      creditLimitUSD,
      createdAt,
    });
    const ref = await addDoc(userCollection(COL), account);
    return { id: ref.id, ...account } as Account;
  },
  async update(id, patch) {
    const ref = userDoc(COL, id);
    const nextPatch: Partial<Account> = { ...patch };

    if (patch.currency !== undefined || patch.initialBalance !== undefined) {
      const existing = await getDoc(ref);
      if (!existing.exists()) throw new Error(`Account ${id} not found`);
      const current = existing.data() as Omit<Account, "id">;
      const currency = patch.currency ?? current.currency ?? BASE_CURRENCY;
      const initialBalance =
        patch.initialBalance ?? current.initialBalance ?? 0;
      const rate = await getRate(currency, BASE_CURRENCY);
      nextPatch.initialBalanceUSD = initialBalance * rate;
    }

    if (patch.currency !== undefined || patch.creditLimit !== undefined) {
      const existing = await getDoc(ref);
      if (!existing.exists()) throw new Error(`Account ${id} not found`);
      const current = existing.data() as Omit<Account, "id">;
      const currency = patch.currency ?? current.currency ?? BASE_CURRENCY;
      const nextLimit =
        patch.creditLimit !== undefined ? patch.creditLimit : current.creditLimit;
      if (typeof nextLimit === "number") {
        const rate = await getRate(currency, BASE_CURRENCY);
        nextPatch.creditLimitUSD = nextLimit * rate;
      } else {
        nextPatch.creditLimitUSD = undefined;
      }
    }

    await updateDoc(ref, stripUndefined(nextPatch));
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Account ${id} not found`);
    return hydrate(snap.id, snap.data() as Omit<Account, "id">);
  },
  async remove(id) {
    await deleteDoc(userDoc(COL, id));
  },
};
