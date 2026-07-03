import type { Category, NewCategory } from "@/lib/types";

export interface CategoryStore {
  list(): Promise<Category[]>;
  add(input: NewCategory): Promise<Category>;
  remove(id: string): Promise<void>;
}
