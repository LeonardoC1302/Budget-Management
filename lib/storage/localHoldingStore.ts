import type {
  Holding,
  HoldingValuation,
  NewHolding,
  NewHoldingValuation,
} from "@/lib/types";
import type { HoldingStore } from "@/lib/storage/HoldingStore";

const HOLDINGS_KEY = "budget:holdings:v1";
const VALUATIONS_KEY = "budget:holding-valuations:v1";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readHoldings(): Holding[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HOLDINGS_KEY);
    return raw ? (JSON.parse(raw) as Holding[]) : [];
  } catch {
    return [];
  }
}

function writeHoldings(items: Holding[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HOLDINGS_KEY, JSON.stringify(items));
}

function readValuations(): HoldingValuation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VALUATIONS_KEY);
    return raw ? (JSON.parse(raw) as HoldingValuation[]) : [];
  } catch {
    return [];
  }
}

function writeValuations(items: HoldingValuation[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VALUATIONS_KEY, JSON.stringify(items));
}

export const localHoldingStore: HoldingStore = {
  async listHoldings() {
    return readHoldings().sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  },
  async addHolding(input: NewHolding) {
    const holding: Holding = {
      ...input,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    writeHoldings([...readHoldings(), holding]);
    return holding;
  },
  async updateHolding(id, patch) {
    const items = readHoldings();
    const idx = items.findIndex((h) => h.id === id);
    if (idx === -1) throw new Error(`Holding ${id} not found`);
    const updated: Holding = { ...items[idx], ...patch };
    items[idx] = updated;
    writeHoldings(items);
    return updated;
  },
  async removeHolding(id) {
    writeHoldings(readHoldings().filter((h) => h.id !== id));
    writeValuations(readValuations().filter((v) => v.holdingId !== id));
  },

  async listValuations() {
    return readValuations().sort((a, b) =>
      b.asOfDate.localeCompare(a.asOfDate),
    );
  },
  async addValuation(input: NewHoldingValuation) {
    const valuation: HoldingValuation = {
      ...input,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    writeValuations([valuation, ...readValuations()]);
    return valuation;
  },
  async updateValuation(id, patch) {
    const items = readValuations();
    const idx = items.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error(`Valuation ${id} not found`);
    const updated: HoldingValuation = { ...items[idx], ...patch };
    items[idx] = updated;
    writeValuations(items);
    return updated;
  },
  async removeValuation(id) {
    writeValuations(readValuations().filter((v) => v.id !== id));
  },
};
