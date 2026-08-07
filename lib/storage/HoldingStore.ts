import type {
  Holding,
  HoldingValuation,
  NewHolding,
  NewHoldingValuation,
} from "@/lib/types";

export interface HoldingStore {
  listHoldings(): Promise<Holding[]>;
  addHolding(input: NewHolding): Promise<Holding>;
  updateHolding(id: string, patch: Partial<NewHolding>): Promise<Holding>;
  removeHolding(id: string): Promise<void>;

  listValuations(): Promise<HoldingValuation[]>;
  addValuation(input: NewHoldingValuation): Promise<HoldingValuation>;
  updateValuation(
    id: string,
    patch: Partial<NewHoldingValuation>,
  ): Promise<HoldingValuation>;
  removeValuation(id: string): Promise<void>;
}
