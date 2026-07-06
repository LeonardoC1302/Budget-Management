import type { AccountStore } from "@/lib/storage/AccountStore";
import type { BudgetStore } from "@/lib/storage/BudgetStore";
import type { CategoryStore } from "@/lib/storage/CategoryStore";
import type { GoalStore } from "@/lib/storage/GoalStore";
import type { TransactionStore } from "@/lib/storage/TransactionStore";
import { localAccountStore } from "@/lib/storage/localAccountStore";
import { localBudgetStore } from "@/lib/storage/localBudgetStore";
import { localCategoryStore } from "@/lib/storage/localCategoryStore";
import { localGoalStore } from "@/lib/storage/localGoalStore";
import { localTransactionStore } from "@/lib/storage/localTransactionStore";

/**
 * Single entry point for storage. Swap the implementations here (e.g. a
 * `firebaseTransactionStore`) and every consumer picks it up transparently.
 */
export const accountStore: AccountStore = localAccountStore;
export const budgetStore: BudgetStore = localBudgetStore;
export const categoryStore: CategoryStore = localCategoryStore;
export const goalStore: GoalStore = localGoalStore;
export const transactionStore: TransactionStore = localTransactionStore;

export type {
  AccountStore,
  BudgetStore,
  CategoryStore,
  GoalStore,
  TransactionStore,
};
