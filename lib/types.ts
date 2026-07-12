export type TransactionType = "income" | "expense" | "transfer";

export type TransferDirection = "out" | "in";

export type AccountType = "debit" | "credit" | "wallet" | "cash" | "savings";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  initialBalanceUSD: number;
  currency: string;
  createdAt: string;
}

export type NewAccount = Omit<Account, "id" | "createdAt" | "initialBalanceUSD">;

export interface Category {
  id: string;
  name: string;
  type: Exclude<TransactionType, "transfer">;
  isDefault: boolean;
  createdAt: string;
}

export type NewCategory = Omit<Category, "id" | "createdAt" | "isDefault">;

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  amountUSD: number;
  currency: string;
  accountId: string;
  categoryId: string;
  description: string;
  date: string;
  createdAt: string;
  transferId?: string;
  transferDirection?: TransferDirection;
  linkedAccountId?: string;
  recurringId?: string;
}

export type NewTransaction = Omit<Transaction, "id" | "createdAt" | "amountUSD">;

export type RecurrenceFrequency =
  | "monthly"
  | "semi-monthly"
  | "weekly"
  | "biweekly"
  | "yearly";

export interface RecurringTransaction {
  id: string;
  type: Exclude<TransactionType, "transfer">;
  amount: number;
  currency: string;
  accountId: string;
  categoryId: string;
  description: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  semiMonthlyDays?: [number, number];
  endDate?: string;
  lastGeneratedDate?: string;
  active: boolean;
  createdAt: string;
}

export type NewRecurringTransaction = Omit<
  RecurringTransaction,
  "id" | "createdAt" | "lastGeneratedDate"
>;

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  monthly: "Monthly",
  "semi-monthly": "Semi-monthly (two days)",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  yearly: "Yearly",
};

export interface NewTransfer {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  description: string;
  date: string;
}

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
