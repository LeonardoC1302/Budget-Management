import type { Category, NewCategory } from "@/lib/types";

export interface CategoryStore {
  list(): Promise<Category[]>;
  add(input: NewCategory, ownerUid?: string): Promise<Category>;
  remove(id: string, ownerUid?: string): Promise<void>;
}
