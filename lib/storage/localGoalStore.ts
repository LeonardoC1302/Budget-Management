import type { Goal, GoalContribution } from "@/lib/types";
import type { GoalStore } from "@/lib/storage/GoalStore";

const GOALS_KEY = "budget:goals:v1";
const CONTRIBUTIONS_KEY = "budget:goal-contributions:v1";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readGoals(): Goal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GOALS_KEY);
    return raw ? (JSON.parse(raw) as Goal[]) : [];
  } catch {
    return [];
  }
}

function writeGoals(items: Goal[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GOALS_KEY, JSON.stringify(items));
}

function readContributions(): GoalContribution[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONTRIBUTIONS_KEY);
    return raw ? (JSON.parse(raw) as GoalContribution[]) : [];
  } catch {
    return [];
  }
}

function writeContributions(items: GoalContribution[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(items));
}

export const localGoalStore: GoalStore = {
  async listGoals() {
    return readGoals().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async addGoal(input) {
    const goal: Goal = {
      ...input,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    writeGoals([...readGoals(), goal]);
    return goal;
  },
  async updateGoal(id, patch) {
    const items = readGoals();
    const idx = items.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error(`Goal ${id} not found`);
    const updated: Goal = { ...items[idx], ...patch };
    items[idx] = updated;
    writeGoals(items);
    return updated;
  },
  async removeGoal(id) {
    writeGoals(readGoals().filter((g) => g.id !== id));
    writeContributions(readContributions().filter((c) => c.goalId !== id));
  },

  async listContributions() {
    return readContributions().sort((a, b) => b.date.localeCompare(a.date));
  },
  async addContribution(input) {
    const contribution: GoalContribution = {
      ...input,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    writeContributions([contribution, ...readContributions()]);
    return contribution;
  },
  async removeContribution(id) {
    writeContributions(readContributions().filter((c) => c.id !== id));
  },
};
