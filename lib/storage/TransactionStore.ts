import type { NewTransaction, NewTransfer, Transaction } from "@/lib/types";

/**
 * TransactionStore is the storage contract. Swap the implementation
 * (localStorage today, Firebase tomorrow) without touching consumers.
 */
export interface TransactionStore {
  list(): Promise<Transaction[]>;
  add(input: NewTransaction, ownerUid?: string): Promise<Transaction>;
  addMany(inputs: NewTransaction[], ownerUid?: string): Promise<void>;
  addTransfer(input: NewTransfer, ownerUid?: string): Promise<void>;
  update(
    id: string,
    input: NewTransaction,
    ownerUid?: string,
  ): Promise<Transaction>;
  remove(id: string, ownerUid?: string): Promise<void>;
  removeTransfer(transferId: string, ownerUid?: string): Promise<void>;
}
