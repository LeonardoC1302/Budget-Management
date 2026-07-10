import type { NewTransaction, NewTransfer, Transaction } from "@/lib/types";

/**
 * TransactionStore is the storage contract. Swap the implementation
 * (localStorage today, Firebase tomorrow) without touching consumers.
 */
export interface TransactionStore {
  list(): Promise<Transaction[]>;
  add(input: NewTransaction): Promise<Transaction>;
  addTransfer(input: NewTransfer): Promise<void>;
  remove(id: string): Promise<void>;
  removeTransfer(transferId: string): Promise<void>;
}
