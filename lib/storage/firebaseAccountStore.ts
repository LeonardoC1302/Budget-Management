import {
  addDoc,
  deleteDoc,
  getDoc,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import {
  listAcrossOwners,
  ownerCollection,
  ownerDoc,
} from "@/lib/firebase/firestoreHelpers";
import { requireWriteUid, findOwnerCtx } from "@/lib/firebase/access";
import { getRate } from "@/lib/services/exchangeRates";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import type { Account, NewAccount, OwnerCtx } from "@/lib/types";
import type { AccountStore } from "@/lib/storage/AccountStore";

const COL = "accounts";

function hydrate(
  id: string,
  data: Omit<Account, "id">,
  owner: OwnerCtx,
): Account {
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
  return {
    ...data,
    id,
    currency,
    initialBalanceUSD,
    creditLimitUSD,
    _owner: owner,
  };
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
    return listAcrossOwners<Account>(
      COL,
      (id, data, owner) => hydrate(id, data as Omit<Account, "id">, owner),
      (col) => query(col, orderBy("createdAt")),
    );
  },
  async add(input: NewAccount, ownerUid?: string) {
    const uid = requireWriteUid(ownerUid);
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
    const ref = await addDoc(ownerCollection(uid, COL), account);
    return {
      id: ref.id,
      ...account,
      _owner: findOwnerCtx(uid) ?? { uid, nickname: "You", permission: "owner" },
    } as Account;
  },
  async update(id, patch, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const ref = ownerDoc(uid, COL, id);
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

    // Never persist `_owner` — it's a read-time decoration.
    delete (nextPatch as { _owner?: unknown })._owner;

    await updateDoc(ref, stripUndefined(nextPatch));
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Account ${id} not found`);
    return hydrate(
      snap.id,
      snap.data() as Omit<Account, "id">,
      findOwnerCtx(uid) ?? { uid, nickname: "You", permission: "owner" },
    );
  },
  async remove(id, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    await deleteDoc(ownerDoc(uid, COL, id));
  },
};
