"use client";

import Button from "@/components/atoms/Button";
import Modal from "@/components/atoms/Modal";
import PayCardForm from "@/components/molecules/PayCardForm";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { effectiveDue } from "@/lib/credit/statement";
import { formatCurrency } from "@/lib/utils/format";
import type { Account, NewTransfer } from "@/lib/types";
import { useMemo, useState } from "react";

const NUDGE_WINDOW_DAYS = 10;

function formatDueDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysCopy(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days > 0) return `in ${days} days`;
  if (days === -1) return "1 day late";
  return `${Math.abs(days)} days late`;
}

export default function CreditCardNudge() {
  const { accounts, creditTotalsByAccount, refresh } = useAccounts();
  const { transactions, addTransfer } = useTransactions();
  const [payingCard, setPayingCard] = useState<Account | null>(null);

  const rows = useMemo(() => {
    const out: Array<{
      card: Account;
      amount: number;
      date: Date;
      days: number;
    }> = [];
    for (const a of accounts) {
      if (a.type !== "credit") continue;
      const totals = creditTotalsByAccount[a.id];
      if (!totals) continue;
      const due = effectiveDue(totals);
      if (due.kind !== "due") continue;
      if (due.daysUntil > NUDGE_WINDOW_DAYS) continue;
      out.push({ card: a, amount: due.amount, date: due.date, days: due.daysUntil });
    }
    return out.sort((a, b) => a.days - b.days);
  }, [accounts, creditTotalsByAccount]);

  if (rows.length === 0) return null;

  const payingTotals = payingCard ? creditTotalsByAccount[payingCard.id] : undefined;

  async function handlePay(input: NewTransfer) {
    await addTransfer(input);
    await refresh();
    setPayingCard(null);
  }

  return (
    <>
      <section
        className="surface p-4 flex flex-col gap-3"
        aria-labelledby="card-nudge-heading"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="card-nudge-heading" className="kicker">
            Cards to settle
          </h2>
          <span className="text-[11px] text-fg-subtle uppercase tracking-[0.14em]">
            {rows.length} due within {NUDGE_WINDOW_DAYS} days
          </span>
        </div>
        <div className="rooms" role="list">
          {rows.map(({ card, amount, date, days }) => {
            const urgent = days <= 3;
            return (
              <div
                key={card.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-sm text-fg truncate">
                    {card.name}
                  </p>
                  <p
                    className={
                      urgent
                        ? "text-[11px] text-expense mt-1 uppercase tracking-[0.14em]"
                        : "text-[11px] text-fg-muted mt-1 uppercase tracking-[0.14em]"
                    }
                  >
                    {formatCurrency(amount, card.currency)} · {formatDueDate(date)} · {daysCopy(days)}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPayingCard(card)}
                >
                  Pay
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <Modal
        open={!!payingCard && !!payingTotals}
        onClose={() => setPayingCard(null)}
        title={payingCard ? `Pay ${payingCard.name}` : "Pay card"}
      >
        {payingCard && payingTotals && (
          <PayCardForm
            card={payingCard}
            totals={payingTotals}
            transactions={transactions}
            onSubmit={handlePay}
            onCancel={() => setPayingCard(null)}
          />
        )}
      </Modal>
    </>
  );
}
