"use client";

import AccountCard from "@/components/molecules/AccountCard";
import type { Account } from "@/lib/types";

interface AccountListProps {
  accounts: Account[];
  balances: Record<string, number>;
  txCountByAccount: Record<string, number>;
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
  emptyMessage?: string;
}

export default function AccountList({
  accounts,
  balances,
  txCountByAccount,
  onEdit,
  onDelete,
  emptyMessage = "No accounts yet.",
}: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-fg-muted text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {accounts.map((account) => (
        <li key={account.id}>
          <AccountCard
            account={account}
            balance={balances[account.id] ?? account.initialBalance}
            transactionCount={txCountByAccount[account.id] ?? 0}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
