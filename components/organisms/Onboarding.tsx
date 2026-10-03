"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/components/atoms/Button";
import CurrencySelect from "@/components/atoms/CurrencySelect";
import PerchMark from "@/components/atoms/PerchMark";
import AccountForm from "@/components/molecules/AccountForm";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { updateDisplayCurrency, updateLanguage } from "@/lib/firebase/seed";
import { LANGUAGES, t, type Language } from "@/lib/i18n";
import { accountStore } from "@/lib/storage";
import { ACCOUNT_TYPE_LABELS, type Account, type NewAccount } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";

type Step = "welcome" | "accounts" | "done";

/**
 * First run for new users: pick a language and display currency, add the
 * accounts money actually lives in, then land on the app. Everything can be
 * skipped and changed later in Settings.
 */
export default function Onboarding() {
  const { user, finishOnboarding } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [step, setStep] = useState<Step>("welcome");
  const [currency, setCurrency] = useState("USD");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [adding, setAdding] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uid = user?.uid ?? "";

  async function chooseLanguage(next: Language) {
    setLanguage(next);
    if (uid) await updateLanguage(uid, next).catch(() => {});
  }

  async function saveWelcome() {
    if (uid) await updateDisplayCurrency(uid, currency).catch(() => {});
    setStep("accounts");
  }

  async function addAccount(input: NewAccount) {
    setError(null);
    try {
      const created = await accountStore.add(input);
      setAccounts((prev) => [...prev, created]);
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Couldn't save."));
    }
  }

  async function finish() {
    setFinishing(true);
    try {
      await finishOnboarding();
    } finally {
      setFinishing(false);
    }
  }

  const steps: Step[] = ["welcome", "accounts", "done"];

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            <PerchMark size={20} /> PerchCR
          </span>
          <ol className="flex gap-1.5" aria-label={t("Setup progress")}>
            {steps.map((s, i) => (
              <li
                key={s}
                aria-current={s === step ? "step" : undefined}
                className={cn(
                  "h-1.5 w-6 rounded-full",
                  steps.indexOf(step) >= i ? "bg-accent" : "bg-border",
                )}
              >
                <span className="sr-only">
                  {t("Step {n} of {total}", { n: i + 1, total: steps.length })}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {step === "welcome" && (
          <section className="surface p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h1 className="heading-lg">{t("Welcome to PerchCR")}</h1>
              <p className="text-sm text-fg-muted">
                {t("A quiet place to see your accounts, spending and savings. Two quick choices first.")}
              </p>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="field-label mb-1">{t("Language")}</legend>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    aria-pressed={language === l.value}
                    onClick={() => chooseLanguage(l.value)}
                    className={cn(
                      "btn",
                      language === l.value ? "btn-primary" : "btn-secondary",
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-1">
              <CurrencySelect
                label={t("Show totals in")}
                name="display-currency"
                value={currency}
                onChange={setCurrency}
              />
              <p className="text-xs text-fg-subtle">
                {t("Each account keeps its own currency; totals and charts convert to this one.")}
              </p>
            </div>

            <Button size="lg" fullWidth onClick={saveWelcome}>
              {t("Continue")}
            </Button>
          </section>
        )}

        {step === "accounts" && (
          <section className="surface p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h1 className="heading-lg">{t("Where does your money live?")}</h1>
              <p className="text-sm text-fg-muted">
                {t("Add the accounts you use: a bank account, savings, cash, a digital wallet. Use today's balance as the starting point. Credit cards go on the Cards page later.")}
              </p>
            </div>

            {accounts.length > 0 && (
              <ul className="rooms">
                {accounts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="min-w-0 truncate">
                      {a.name}
                      <span className="text-fg-subtle"> · {t(ACCOUNT_TYPE_LABELS[a.type])}</span>
                    </span>
                    <span className="tabular-nums">{formatCurrency(a.initialBalance, a.currency)}</span>
                  </li>
                ))}
              </ul>
            )}

            {error && <p className="text-sm text-expense">{error}</p>}

            {adding ? (
              <AccountForm
                onSubmit={addAccount}
                onCancel={accounts.length > 0 ? () => setAdding(false) : undefined}
              />
            ) : (
              <Button variant="secondary" fullWidth onClick={() => setAdding(true)}>
                {t("+ Add another account")}
              </Button>
            )}

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep("welcome")}>
                {t("Back")}
              </Button>
              <Button className="flex-1" onClick={() => setStep("done")}>
                {accounts.length > 0 ? t("Continue") : t("Skip for now")}
              </Button>
            </div>
          </section>
        )}

        {step === "done" && (
          <section className="surface p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h1 className="heading-lg">{t("You're set")}</h1>
              <p className="text-sm text-fg-muted">
                {t("Log transactions as they happen with the Add button. A few things worth doing when you have a minute:")}
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              <li>· {t("Set monthly caps on the categories you watch, in Budgets.")}</li>
              <li>· {t("Add salary, rent and subscriptions once, in Recurring.")}</li>
              <li>
                ·{" "}
                <Link href="/settings/security" className="underline underline-offset-2" onClick={() => void finish()}>
                  {t("Turn on app lock")}
                </Link>{" "}
                {t("if others use this device.")}
              </li>
            </ul>
            <Button size="lg" fullWidth onClick={finish} disabled={finishing}>
              {t("Open PerchCR")}
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
