import type { NewTransaction, NewTransfer, Transaction } from "@/lib/types";

/**
 * TransactionStore is the storage contract. Swap the implementation
 * (localStorage today, Firebase tomorrow) without touching consumers.
 */
export interface TransactionStore {
  list(): Promise<Transaction[]>;
  add(input: NewTransaction): Promise<Transaction>;
  addMany(inputs: NewTransaction[]): Promise<void>;
  addTransfer(input: NewTransfer): Promise<void>;
  update(id: string, input: NewTransaction): Promise<Transaction>;
  remove(id: string): Promise<void>;
  removeTransfer(transferId: string): Promise<void>;
}
