import type {
  Goal,
  GoalContribution,
  NewGoal,
  NewGoalContribution,
} from "@/lib/types";

export interface GoalStore {
  listGoals(): Promise<Goal[]>;
  addGoal(input: NewGoal): Promise<Goal>;
  updateGoal(id: string, patch: Partial<NewGoal>): Promise<Goal>;
  removeGoal(id: string): Promise<void>;

  listContributions(): Promise<GoalContribution[]>;
  addContribution(input: NewGoalContribution): Promise<GoalContribution>;
  removeContribution(id: string): Promise<void>;
}
