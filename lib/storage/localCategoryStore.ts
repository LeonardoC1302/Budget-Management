import type { Category } from "@/lib/types";
import type { CategoryStore } from "@/lib/storage/CategoryStore";
import { defaultCategories } from "@/lib/storage/seeds";

const KEY = "budget:categories:v1";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function read(): Category[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const seeded = defaultCategories();
      window.localStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as Category[];
  } catch {
    return [];
  }
}

function write(items: Category[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export const localCategoryStore: CategoryStore = {
  async list() {
    return read();
  },
  async add(input) {
    const category: Category = {
      ...input,
      id: makeId(),
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    write([...read(), category]);
    return category;
  },
  async remove(id) {
    const items = read();
    const target = items.find((c) => c.id === id);
    if (target?.isDefault) {
      throw new Error("Default categories cannot be deleted");
    }
    write(items.filter((c) => c.id !== id));
  },
};
