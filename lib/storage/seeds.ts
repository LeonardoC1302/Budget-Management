import type { Account, Category } from "@/lib/types";

export const DEFAULT_ACCOUNT_ID = "default-cash";

export function defaultAccount(): Account {
  return {
    id: DEFAULT_ACCOUNT_ID,
    name: "Cash",
    type: "cash",
    initialBalance: 0,
    currency: "USD",
    createdAt: new Date(0).toISOString(),
  };
}

interface CategorySeed {
  id: string;
  name: string;
  type: "income" | "expense";
}

const INCOME_SEEDS: CategorySeed[] = [
  { id: "cat-salary", name: "Salary", type: "income" },
  { id: "cat-freelance", name: "Freelance", type: "income" },
  { id: "cat-investment", name: "Investment", type: "income" },
  { id: "cat-gift", name: "Gift", type: "income" },
  { id: "cat-income-other", name: "Other", type: "income" },
];

const EXPENSE_SEEDS: CategorySeed[] = [
  { id: "cat-food", name: "Food", type: "expense" },
  { id: "cat-transport", name: "Transport", type: "expense" },
  { id: "cat-housing", name: "Housing", type: "expense" },
  { id: "cat-utilities", name: "Utilities", type: "expense" },
  { id: "cat-entertainment", name: "Entertainment", type: "expense" },
  { id: "cat-health", name: "Health", type: "expense" },
  { id: "cat-shopping", name: "Shopping", type: "expense" },
  { id: "cat-expense-other", name: "Other", type: "expense" },
];

export function defaultCategories(): Category[] {
  const createdAt = new Date(0).toISOString();
  return [...INCOME_SEEDS, ...EXPENSE_SEEDS].map((seed) => ({
    ...seed,
    isDefault: true,
    createdAt,
  }));
}
