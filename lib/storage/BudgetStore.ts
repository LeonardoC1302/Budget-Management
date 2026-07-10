import type { Budget, NewBudget } from "@/lib/types";

export interface BudgetStore {
  list(): Promise<Budget[]>;
  add(input: NewBudget): Promise<Budget>;
  update(id: string, patch: Partial<NewBudget>): Promise<Budget>;
  remove(id: string): Promise<void>;
}
