import type { Budget } from "@/lib/types";
import type { BudgetStore } from "@/lib/storage/BudgetStore";

const KEY = "budget:budgets:v1";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function read(): Budget[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Budget[]) : [];
  } catch {
    return [];
  }
}

function write(items: Budget[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export const localBudgetStore: BudgetStore = {
  async list() {
    return read().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async add(input) {
    const items = read();
    if (items.some((b) => b.categoryId === input.categoryId)) {
      throw new Error("A budget for this category already exists.");
    }
    const budget: Budget = {
      ...input,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    write([...items, budget]);
    return budget;
  },
  async update(id, patch) {
    const items = read();
    const idx = items.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error(`Budget ${id} not found`);
    const updated: Budget = { ...items[idx], ...patch };
    items[idx] = updated;
    write(items);
    return updated;
  },
  async remove(id) {
    write(read().filter((b) => b.id !== id));
  },
};
