import type { Account, NewAccount } from "@/lib/types";

export interface AccountStore {
  list(): Promise<Account[]>;
  add(input: NewAccount, ownerUid?: string): Promise<Account>;
  update(id: string, patch: Partial<NewAccount>, ownerUid?: string): Promise<Account>;
  remove(id: string, ownerUid?: string): Promise<void>;
}
