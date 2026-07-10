import type { AccountStore } from "@/lib/storage/AccountStore";
import type { BudgetStore } from "@/lib/storage/BudgetStore";
import type { CategoryStore } from "@/lib/storage/CategoryStore";
import type { GoalStore } from "@/lib/storage/GoalStore";
import type { TransactionStore } from "@/lib/storage/TransactionStore";
import { firebaseAccountStore } from "@/lib/storage/firebaseAccountStore";
import { firebaseBudgetStore } from "@/lib/storage/firebaseBudgetStore";
import { firebaseCategoryStore } from "@/lib/storage/firebaseCategoryStore";
import { firebaseGoalStore } from "@/lib/storage/firebaseGoalStore";
import { firebaseTransactionStore } from "@/lib/storage/firebaseTransactionStore";

/**
 * Single entry point for storage. Swap the implementations here (e.g. back to a
 * `local*Store`) and every consumer picks it up transparently.
 */
export const accountStore: AccountStore = firebaseAccountStore;
export const budgetStore: BudgetStore = firebaseBudgetStore;
export const categoryStore: CategoryStore = firebaseCategoryStore;
export const goalStore: GoalStore = firebaseGoalStore;
export const transactionStore: TransactionStore = firebaseTransactionStore;

export type {
  AccountStore,
  BudgetStore,
  CategoryStore,
  GoalStore,
  TransactionStore,
};
