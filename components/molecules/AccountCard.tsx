import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import { DeleteIcon, EditIcon } from "@/lib/action/icons";
import { ACCOUNT_TYPE_LABELS, type Account } from "@/lib/types";

interface AccountCardProps {
  account: Account;
  balance: number;
  transactionCount: number;
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
}

export default function AccountCard({
  account,
  balance,
  transactionCount,
  onEdit,
  onDelete,
}: AccountCardProps) {
  const canDelete = transactionCount === 0;

  return (
    <div className="px-4 py-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-serif text-base text-fg truncate">{account.name}</p>
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

      {(onEdit || onDelete) && (
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
  );
}
