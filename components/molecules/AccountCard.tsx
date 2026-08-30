import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import OwnerBadge from "@/components/atoms/OwnerBadge";
import { DeleteIcon, EditIcon } from "@/lib/action/icons";
import { ACCOUNT_TYPE_LABELS, type Account } from "@/lib/types";
import type { GoalReservation } from "@/hooks/useAccounts";

interface AccountCardProps {
  account: Account;
  balance: number;
  transactionCount: number;
  reservations?: GoalReservation[];
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
}

export default function AccountCard({
  account,
  balance,
  transactionCount,
  reservations = [],
  onEdit,
  onDelete,
}: AccountCardProps) {
  const canDelete = transactionCount === 0;
  const totalReserved = reservations.reduce((s, r) => s + r.amount, 0);
  const freeToUse = balance - totalReserved;
  const hasReservations = reservations.length > 0;
  // Guests with read-only access must not see edit/delete controls at all —
  // the store would reject the write, and hiding the controls is the primary
  // UX layer of the read/write toggle.
  const readOnly = account._owner && account._owner.permission === "read";

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-serif text-base text-fg truncate">
              {account.name}
            </p>
            <OwnerBadge owner={account._owner} />
          </div>
          <p className="text-[11px] text-fg-muted mt-1 uppercase tracking-[0.14em]">
            {ACCOUNT_TYPE_LABELS[account.type]} · {transactionCount} tx
          </p>
        </div>

        <Amount
          value={balance}
          tone={balance >= 0 ? "income" : "expense"}
          size="lg"
          currency={account.currency}
          className="font-serif"
        />

        {(onEdit || onDelete) && !readOnly && (
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Edit ${account.name}`}
                onClick={() => onEdit(account)}
                className="px-2"
              >
                <EditIcon aria-hidden />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Delete ${account.name}`}
                onClick={() => onDelete(account)}
                disabled={!canDelete}
                title={
                  canDelete
                    ? "Delete account"
                    : "Delete or reassign this account's transactions first"
                }
                className="px-2"
              >
                <DeleteIcon aria-hidden />
              </Button>
            )}
          </div>
        )}
      </div>

      {hasReservations && (
        <div className="flex flex-col gap-1 pl-0 text-xs">
          {reservations.map((r) => (
            <div
              key={r.goalId}
              className="flex items-center justify-between gap-3"
            >
              <span className="text-fg-muted truncate">
                Reserved for {r.goalName}
              </span>
              <Amount
                value={r.amount}
                tone="neutral"
                size="sm"
                currency={account.currency}
              />
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-border">
            <span className="text-fg uppercase tracking-[0.14em] text-[11px]">
              Free to use
            </span>
            <Amount
              value={freeToUse}
              tone={freeToUse >= 0 ? "income" : "expense"}
              size="sm"
              currency={account.currency}
              className="font-serif"
            />
          </div>
        </div>
      )}
    </div>
  );
}
