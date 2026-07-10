import type { Account } from "@/lib/types";
import type { AccountStore } from "@/lib/storage/AccountStore";
import { defaultAccount } from "@/lib/storage/seeds";

const KEY = "budget:accounts:v1";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function read(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const seeded = [defaultAccount()];
      window.localStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as Account[];
  } catch {
    return [];
  }
}

function write(items: Account[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export const localAccountStore: AccountStore = {
  async list() {
    return read().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async add(input) {
    const account: Account = {
      ...input,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    write([...read(), account]);
    return account;
  },
  async update(id, patch) {
    const items = read();
    const idx = items.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Account ${id} not found`);
    const updated: Account = { ...items[idx], ...patch };
    items[idx] = updated;
    write(items);
    return updated;
  },
  async remove(id) {
    write(read().filter((a) => a.id !== id));
  },
};
