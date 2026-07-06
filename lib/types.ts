export type TransactionType = "income" | "expense";

export type AccountType = "debit" | "credit" | "wallet" | "cash" | "savings";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currency: string;
  createdAt: string;
}

export type NewAccount = Omit<Account, "id" | "createdAt">;

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  isDefault: boolean;
  createdAt: string;
}

export type NewCategory = Omit<Category, "id" | "createdAt" | "isDefault">;

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  categoryId: string;
  description: string;
  date: string;
  createdAt: string;
}

export type NewTransaction = Omit<Transaction, "id" | "createdAt">;

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  initialAmount: number;
  currency: string;
  targetDate?: string;
  createdAt: string;
}

export type NewGoal = Omit<Goal, "id" | "createdAt">;

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  note?: string;
  date: string;
  createdAt: string;
}

export type NewGoalContribution = Omit<GoalContribution, "id" | "createdAt">;

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export type NewBudget = Omit<Budget, "id" | "createdAt">;

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  debit: "Debit",
  credit: "Credit",
  wallet: "Digital wallet",
  cash: "Cash",
  savings: "Savings",
};
