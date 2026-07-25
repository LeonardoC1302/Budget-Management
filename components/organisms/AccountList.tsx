"use client";

import EmptyState from "@/components/atoms/EmptyState";
import AccountCard from "@/components/molecules/AccountCard";
import type { Account } from "@/lib/types";

interface AccountListProps {
  accounts: Account[];
  balances: Record<string, number>;
  txCountByAccount: Record<string, number>;
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionOnClick?: () => void;
  emptyActionHref?: string;
  /** @deprecated Use `emptyTitle` instead. Kept for backwards compat. */
  emptyMessage?: string;
}

export default function AccountList({
  accounts,
  balances,
  txCountByAccount,
  onEdit,
  onDelete,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionOnClick,
  emptyActionHref,
  emptyMessage = "No accounts yet.",
}: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? emptyMessage}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        actionOnClick={emptyActionOnClick}
        actionHref={emptyActionHref}
      />
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
