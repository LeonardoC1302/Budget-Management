import type { Budget, NewBudget } from "@/lib/types";

export interface BudgetStore {
  list(): Promise<Budget[]>;
  add(input: NewBudget, ownerUid?: string): Promise<Budget>;
  update(id: string, patch: Partial<NewBudget>, ownerUid?: string): Promise<Budget>;
  remove(id: string, ownerUid?: string): Promise<void>;
}
