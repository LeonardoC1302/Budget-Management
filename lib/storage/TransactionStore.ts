import type { NewTransaction, NewTransfer, Transaction } from "@/lib/types";

/**
 * TransactionStore is the storage contract. Swap the implementation
 * (localStorage today, Firebase tomorrow) without touching consumers.
 */
export interface TransactionStore {
  list(): Promise<Transaction[]>;
  add(input: NewTransaction, ownerUid?: string): Promise<Transaction>;
  // Firebase resolves to the new doc ids (used to undo an import).
  addMany(inputs: NewTransaction[], ownerUid?: string): Promise<string[] | void>;
  addTransfer(input: NewTransfer, ownerUid?: string): Promise<void>;
  update(
    id: string,
    input: NewTransaction,
    ownerUid?: string,
  ): Promise<Transaction>;
  // Firebase stores soft-delete and resolve to the trash entry id (for undo).
  remove(id: string, ownerUid?: string): Promise<string | void>;
  removeTransfer(transferId: string, ownerUid?: string): Promise<string | void>;
  // Recompute `accountAmount` for every transaction on `accountId` after the
  // account switched to `currency`. Without this, balances keep the old
  // currency's numbers under the new currency's symbol.
  rebaseAccountCurrency(accountId: string, currency: string): Promise<void>;
}
