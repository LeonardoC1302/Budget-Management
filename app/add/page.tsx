"use client";

import { useRouter } from "next/navigation";
import Card from "@/components/atoms/Card";
import TransactionForm from "@/components/molecules/TransactionForm";
import { useTransactions } from "@/hooks/useTransactions";

export default function AddTransactionPage() {
  const router = useRouter();
  const { add } = useTransactions();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="label-sm">New</span>
        <h1 className="heading-xl">Add transaction</h1>
      </header>

      <Card>
        <TransactionForm
          onSubmit={async (input) => {
            await add(input);
            router.push("/");
          }}
        />
      </Card>
    </div>
  );
}
