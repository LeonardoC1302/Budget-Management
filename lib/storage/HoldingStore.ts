import type {
  Holding,
  HoldingValuation,
  NewHolding,
  NewHoldingValuation,
} from "@/lib/types";

export interface HoldingStore {
  listHoldings(): Promise<Holding[]>;
  addHolding(input: NewHolding, ownerUid?: string): Promise<Holding>;
  updateHolding(
    id: string,
    patch: Partial<NewHolding>,
    ownerUid?: string,
  ): Promise<Holding>;
  removeHolding(id: string, ownerUid?: string): Promise<void>;

  listValuations(): Promise<HoldingValuation[]>;
  addValuation(
    input: NewHoldingValuation,
    ownerUid?: string,
  ): Promise<HoldingValuation>;
  updateValuation(
    id: string,
    patch: Partial<NewHoldingValuation>,
    ownerUid?: string,
  ): Promise<HoldingValuation>;
  removeValuation(id: string, ownerUid?: string): Promise<void>;
}
