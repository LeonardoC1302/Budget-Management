import type { Account, NewAccount } from "@/lib/types";

export interface AccountStore {
  list(): Promise<Account[]>;
  add(input: NewAccount): Promise<Account>;
  update(id: string, patch: Partial<NewAccount>): Promise<Account>;
  remove(id: string): Promise<void>;
}
