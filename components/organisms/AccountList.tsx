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
    <div className="rooms" role="list">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          balance={balances[account.id] ?? account.initialBalance}
          transactionCount={txCountByAccount[account.id] ?? 0}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
