import type {
  Goal,
  GoalContribution,
  NewGoal,
  NewGoalContribution,
} from "@/lib/types";

export interface GoalStore {
  listGoals(): Promise<Goal[]>;
  addGoal(input: NewGoal, ownerUid?: string): Promise<Goal>;
  updateGoal(id: string, patch: Partial<NewGoal>, ownerUid?: string): Promise<Goal>;
  removeGoal(id: string, ownerUid?: string): Promise<void>;

  listContributions(): Promise<GoalContribution[]>;
  addContribution(
    input: NewGoalContribution,
    ownerUid?: string,
  ): Promise<GoalContribution>;
  removeContribution(id: string, ownerUid?: string): Promise<void>;
}
