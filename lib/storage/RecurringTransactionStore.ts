import type {
  NewRecurringTransaction,
  RecurringTransaction,
} from "@/lib/types";

export interface RecurringTransactionStore {
  list(): Promise<RecurringTransaction[]>;
  add(input: NewRecurringTransaction): Promise<RecurringTransaction>;
  update(
    id: string,
    patch: Partial<Omit<RecurringTransaction, "id" | "createdAt">>,
  ): Promise<RecurringTransaction>;
  remove(id: string): Promise<void>;
  updateLastGeneratedDates(
    updates: { id: string; lastGeneratedDate: string }[],
  ): Promise<void>;
}
