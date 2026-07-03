import type { NewTransaction, Transaction } from "@/lib/types";

/**
 * TransactionStore is the storage contract. Swap the implementation
 * (localStorage today, Firebase tomorrow) without touching consumers.
 */
export interface TransactionStore {
  list(): Promise<Transaction[]>;
  add(input: NewTransaction): Promise<Transaction>;
  remove(id: string): Promise<void>;
}
