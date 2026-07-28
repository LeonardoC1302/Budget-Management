"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import TransactionForm from "@/components/molecules/TransactionForm";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/utils/format";
import type { NewTransaction } from "@/lib/types";

interface SessionEntry {
  amount: number;
  currency: string;
  type: NewTransaction["type"];
  description: string;
  timestamp: number;
}

const TYPE_LABEL: Record<NewTransaction["type"], string> = {
  income: "income",
  expense: "expense",
  investment: "investment",
  transfer: "transfer",
};

export default function AddTransactionPage() {
  const { add } = useTransactions();
  const [session, setSession] = useState<SessionEntry[]>([]);
  const [formKey, setFormKey] = useState(0);

  const last = session[session.length - 1];

  async function handleSubmit(input: NewTransaction) {
    await add(input);
    setSession((prev) => [
      ...prev,
      {
        amount: input.amount,
        currency: input.currency,
        type: input.type,
        description: input.description ?? "",
        timestamp: Date.now(),
      },
    ]);
    // Bump the form key so the amount/description reset while account & date
    // stay on whatever the user last chose.
    setFormKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead
        kicker="New"
        title="Add transaction"
        actions={
          <Link href="/">
            <Button variant="secondary" size="sm">
              Done
            </Button>
          </Link>
        }
      />

      {last && (
        <section
          className="masthead-balance surface p-5 flex flex-col gap-3"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span
                aria-hidden
                className="w-9 h-9 rounded-full bg-income-soft text-income flex items-center justify-center text-lg"
              >
                &#10003;
              </span>
              <div className="min-w-0">
                <p className="text-sm text-fg">
                  Logged{" "}
                  <span className="font-medium">
                    {formatCurrency(last.amount, last.currency)}
                  </span>{" "}
                  <span className="text-fg-subtle">
                    &middot; {TYPE_LABEL[last.type]}
                  </span>
                </p>
                {last.description && (
                  <p className="text-xs text-fg-subtle truncate">
                    {last.description}
                  </p>
                )}
              </div>
            </div>
            <span className="text-xs text-fg-subtle shrink-0">
              {session.length} this session
            </span>
          </div>
          <p className="text-xs text-fg-subtle">
            The form&apos;s ready for the next one. Tap <em>Done </em> when you&apos;re finished.
          </p>
        </section>
      )}

      <Card>
        <TransactionForm key={formKey} onSubmit={handleSubmit} />
      </Card>
    </div>
  );
}
