import type {
  NewRecurringTransaction,
  RecurringTransaction,
} from "@/lib/types";

export interface RecurringTransactionStore {
  list(): Promise<RecurringTransaction[]>;
  add(
    input: NewRecurringTransaction,
    ownerUid?: string,
  ): Promise<RecurringTransaction>;
  update(
    id: string,
    patch: Partial<Omit<RecurringTransaction, "id" | "createdAt">>,
    ownerUid?: string,
  ): Promise<RecurringTransaction>;
  remove(id: string, ownerUid?: string): Promise<void>;
  updateLastGeneratedDates(
    updates: { id: string; lastGeneratedDate: string; ownerUid?: string }[],
  ): Promise<void>;
}
