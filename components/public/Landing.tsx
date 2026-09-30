"use client";

/*
 * THESIS: The familiar landing layout played straight, at the craft level of
 * Copilot Money, YNAB and Linear, in Perch's own room. It refuses the icon-tile
 * feature grid: features are shown as the product at work.
 * OWN-WORLD: Stone paper by day, warm night by dark mode; hairline "rooms",
 * Newsreader display over Geist, one tracked kicker, celadon only on the
 * primary action, money colors only on money.
 * STORY: Someone juggling colones and dollars sees their month calmly, trusts
 * it's private and works offline, and signs in with Google.
 * FIRST VIEWPORT: Nameplate header. Left: tagline as display serif, one
 * supporting line, Google sign-in and "See how it works". Right: a Perch
 * balance and ledger preview with sample entries in ₡ and $.
 * FORM: Standard landing (the canon), seed 642dceae; sections: hero, three
 * facts, four product rooms, the rest, three steps, questions, close.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import SignInButton from "@/components/public/SignInButton";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";

export default function Landing() {
  return (
    <>
      <DeletedNotice />
      <Hero />
      <Facts />
      <section id="features" aria-labelledby="features-title" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-24">
          <p className="kicker">{t("What it does")}</p>
          <h2 id="features-title" className="landing-h2 mt-3 max-w-2xl">
            {t("Everything your money does, in one calm place.")}
          </h2>
        </div>
        <Showcase
          title={t("Colones and dollars, side by side")}
          body={t("Log each purchase in the currency you paid. Perch keeps the original amount, converts it with the rate your bank actually used, and totals everything in the currency you choose.")}
          points={[
            t("Buy and sell rates from every bank's window, updated through the day"),
            t("Or type the exact rate from your statement"),
            t("Totals in dollars or colones, your pick"),
          ]}
          preview={<CurrencyPreview />}
        />
        <Showcase
          reverse
          title={t("Credit cards, finally clear")}
          body={t("Add your cut and payment days once. Perch shows what's due and by when, what's still unbilled, and how much credit you have left.")}
          points={[
            t("Split purchases into monthly installments"),
            t("Pay the statement or pick the exact charges to cover"),
            t("Check your balance against the bank in one step"),
          ]}
          preview={<CardPreview />}
        />
        <Showcase
          title={t("Budgets you can keep")}
          body={t("Set a monthly cap per category and watch the pace, not just the total. Step back through past months to see how you did.")}
          points={[
            t("Six months at a glance"),
            t("Refunds lower spending instead of counting as income"),
            t("Tag a trip or project and see what it cost"),
          ]}
          preview={<BudgetPreview />}
        />
        <Showcase
          reverse
          title={t("Goals and investments, in the same picture")}
          body={t("Set money aside for what matters and track what you invest: ETFs, stocks, crypto, or a pension you update by hand. Your net worth comes together month by month.")}
          points={[
            t("Recurring contributions, priced at each day's close"),
            t("Broker commissions counted in your cost"),
            t("Withdraw from a goal when life happens"),
          ]}
          preview={<GoalPreview />}
        />
      </section>
      <TheRest />
      <Steps />
      <Questions />
      <Close />
    </>
  );
}

/** Shown once after someone deletes their account from Settings. */
function DeletedNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the URL once after hydration
    setShow(new URLSearchParams(window.location.search).has("deleted"));
  }, []);
  if (!show) return null;
  return (
    <div role="status" className="mx-auto max-w-6xl px-4 sm:px-6 pt-6">
      <p className="surface-2 px-4 py-3 text-sm">
        {t("Your account and all its data were deleted.")}
      </p>
    </div>
  );
}

/* ─────────────────────────────── hero ─────────────────────────────── */

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 sm:pt-20 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="flex flex-col gap-6 max-w-xl">
          <p className="kicker">{t("Personal finance, quietly")}</p>
          <h1 id="hero-title" className="landing-h1">
            {t("A quiet place for your money to rest.")}
          </h1>
          <p className="text-base sm:text-lg text-fg-muted leading-relaxed max-w-lg">
            {t("Track accounts, spending, budgets and goals in colones and dollars. Log a purchase in seconds, even offline, and see where your month stands without the noise.")}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <SignInButton size="lg" withTesters />
            <Link href="#features" className="btn btn-secondary btn-lg">
              {t("See how it works")}
            </Link>
          </div>
          <p className="text-xs text-fg-subtle">
            {t("Works in your browser on phone and computer. Install it to your home screen like an app.")}
          </p>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}

function SampleNote() {
  return <p className="text-[11px] text-fg-subtle mt-3 text-center">{t("Sample data")}</p>;
}

interface SampleEntry {
  date: string;
  title: string;
  note: string;
  amount: number;
  currency: string;
  tone: "pos" | "neg";
}

function HeroPreview() {
  const entries: SampleEntry[] = [
    { date: t("Today"), title: t("Groceries"), note: t("Food · Debit card"), amount: 18450, currency: "CRC", tone: "neg" },
    { date: t("Today"), title: t("Coffee with Ana"), note: t("Dining out · Cash"), amount: 2600, currency: "CRC", tone: "neg" },
    { date: t("Yesterday"), title: t("Salary"), note: t("Salary · Savings"), amount: 2400, currency: "USD", tone: "pos" },
    { date: t("Yesterday"), title: t("Streaming · 1/1"), note: t("Subscriptions · Visa"), amount: 7.99, currency: "USD", tone: "neg" },
  ];
  return (
    <figure className="landing-stage" aria-label={t("Perch home screen with sample data")}>
      <div className="landing-device">
        <div className="masthead-balance surface p-5 flex flex-col gap-2">
          <span className="label-sm">{t("Balance of the month")}</span>
          <span className="font-serif text-4xl tabular-nums text-income">
            {formatCurrency(1284.6, "USD")}
          </span>
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div>
              <span className="label-sm">{t("Income")}</span>
              <p className="figure text-income mt-1">{formatCurrency(2400, "USD")}</p>
            </div>
            <div>
              <span className="label-sm">{t("Expenses")}</span>
              <p className="figure text-expense mt-1">{formatCurrency(1115.4, "USD")}</p>
            </div>
          </div>
        </div>
        <div className="rooms mt-4 landing-entries">
          {entries.map((e, i) => (
            <div key={i} className="entry" style={{ animationDelay: `${120 + i * 70}ms` }}>
              <span className="entry-date">{e.date}</span>
              <div className="entry-body">
                <div className="entry-title">{e.title}</div>
                <div className="entry-note">{e.note}</div>
              </div>
              <span className={cn("entry-amt", e.tone)}>
                {e.tone === "pos" ? "+" : "−"}
                {formatCurrency(e.amount, e.currency)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <SampleNote />
    </figure>
  );
}

/* ─────────────────────────────── facts ────────────────────────────── */

function Facts() {
  const facts = [
    {
      title: t("Built for colones and dollars"),
      body: t("Every amount keeps its currency, with bank window rates from Costa Rica built in."),
    },
    {
      title: t("Works without signal"),
      body: t("Log on the bus or in the mountains. Changes sync when you're back online."),
    },
    {
      title: t("Nothing connects to your bank"),
      body: t("No bank passwords, no aggregators, no ads. You decide what goes in."),
    },
  ];
  return (
    <section aria-label={t("Why Perch")} className="mx-auto max-w-6xl px-4 sm:px-6 pt-20">
      <div className="rooms-h grid-cols-1 md:grid-cols-3 landing-facts">
        {facts.map((f) => (
          <div key={f.title} className="p-6 flex flex-col gap-2">
            <h3 className="heading-lg">{f.title}</h3>
            <p className="text-sm text-fg-muted leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────────── showcase ───────────────────────────── */

interface ShowcaseProps {
  title: string;
  body: string;
  points: string[];
  preview: React.ReactNode;
  reverse?: boolean;
}

function Showcase({ title, body, points, preview, reverse }: ShowcaseProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-20">
      <div
        className={cn(
          "grid gap-10 lg:grid-cols-2 lg:items-center",
          reverse && "lg:[&>*:first-child]:order-2",
        )}
      >
        <div className="flex flex-col gap-4 max-w-lg">
          <h3 className="landing-h3">{title}</h3>
          <p className="text-base text-fg-muted leading-relaxed">{body}</p>
          <ul className="flex flex-col gap-2 pt-1">
            {points.map((p) => (
              <li key={p} className="flex gap-3 text-sm text-fg">
                <span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-border-strong" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>{preview}</div>
      </div>
    </div>
  );
}

function PreviewFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure aria-label={label} className="landing-stage">
      <div className="landing-device">{children}</div>
      <SampleNote />
    </figure>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" | "warn" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
      <span className="text-fg-muted">{label}</span>
      <span
        className={cn(
          "figure whitespace-nowrap",
          tone === "pos" && "text-income",
          tone === "neg" && "text-expense",
          tone === "warn" && "text-invest",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function CurrencyPreview() {
  return (
    <PreviewFrame label={t("A purchase in colones on a dollar card")}>
      <div className="surface p-5 flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="heading-lg">{t("Hardware store")}</span>
          <span className="entry-amt neg">−{formatCurrency(46500, "CRC")}</span>
        </div>
        <div className="surface-2 px-4 divide-y divide-border">
          <Row label={t("Paid with")} value={t("Visa (USD)")} />
          <Row label={t("Bank rate · venta")} value={`${formatCurrency(514.5, "CRC")} / $1`} />
          <Row label={t("On the card")} value={`−${formatCurrency(90.38, "USD")}`} tone="neg" />
        </div>
        <p className="text-xs text-fg-subtle">
          {t("The original ₡ amount is kept; totals use the dollar figure.")}
        </p>
      </div>
    </PreviewFrame>
  );
}

function CardPreview() {
  return (
    <PreviewFrame label={t("A credit card's statement view")}>
      <div className="surface p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{t("Visa Gold")}</p>
            <p className="text-xs text-fg-subtle">{t("Cut on day 20 · Pay on day 5")}</p>
          </div>
          <span className="btn btn-primary btn-sm pointer-events-none" aria-hidden>
            {t("Pay card")}
          </span>
        </div>
        <div>
          <span className="label-sm">{t("You owe")}</span>
          <p className="font-serif text-3xl tabular-nums text-expense mt-1">
            {formatCurrency(612.4, "USD")}
          </p>
          <p className="text-sm text-fg-muted mt-1">
            {t("Pay {amount} by Oct 5 · in 5 days", { amount: formatCurrency(312.4, "USD") })}
          </p>
        </div>
        <div className="h-px bg-border relative overflow-hidden rounded-full" aria-hidden>
          <div className="absolute inset-y-0 left-0 w-[31%] bg-celadon-strong" />
        </div>
        <div className="rooms">
          <div className="entry">
            <span className="entry-date">{t("Nov 20")}</span>
            <div className="entry-body">
              <div className="entry-title">{t("Laptop · 2/6")}</div>
              <div className="entry-note">{t("Upcoming installment")}</div>
            </div>
            <span className="entry-amt neg">{formatCurrency(100, "USD")}</span>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}

function BudgetPreview() {
  const rows = [
    { name: t("Groceries"), spent: 142, cap: 250 },
    { name: t("Dining out"), spent: 96, cap: 120 },
    { name: t("Transport"), spent: 88, cap: 80 },
  ];
  const months = [0.62, 0.81, 1.08, 0.74, 0.9, 0.58];
  return (
    <PreviewFrame label={t("Monthly budgets with a six-month history")}>
      <div className="surface p-5 flex flex-col gap-5">
        <div className="flex items-end gap-2 h-20" aria-hidden>
          {months.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full">
              <div
                className="rounded-[4px]"
                style={{
                  height: `${Math.min(m, 1.15) * 70}%`,
                  background: m > 1 ? "var(--color-expense)" : "var(--color-celadon-strong)",
                  opacity: i === months.length - 1 ? 1 : 0.5,
                }}
              />
            </div>
          ))}
        </div>
        <div className="rooms">
          {rows.map((r) => {
            const over = r.spent > r.cap;
            return (
              <div key={r.name} className="px-4 py-3 flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-serif">{r.name}</span>
                  <span className="figure text-xs">
                    {formatCurrency(r.spent, "USD")}
                    <span className="text-fg-muted"> / {formatCurrency(r.cap, "USD")}</span>
                  </span>
                </div>
                <div className="h-px bg-border relative" aria-hidden>
                  <div
                    className="absolute left-0"
                    style={{
                      width: `${Math.min(r.spent / r.cap, 1) * 100}%`,
                      height: over ? 2 : 1,
                      top: over ? -1 : 0,
                      background: over ? "var(--color-expense)" : "var(--color-celadon-strong)",
                    }}
                  />
                </div>
                <span className={cn("lede text-xs", over && "text-expense")}>
                  {over
                    ? t("Over cap by {amount}.", { amount: formatCurrency(r.spent - r.cap, "USD") })
                    : t("{amount} left this month.", { amount: formatCurrency(r.cap - r.spent, "USD") })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </PreviewFrame>
  );
}

function GoalPreview() {
  return (
    <PreviewFrame label={t("A savings goal and an investment")}>
      <div className="flex flex-col gap-4">
        <div className="surface p-5 flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="heading-lg">{t("Trip to Japan")}</span>
            <span className="text-xs text-fg-subtle">{t("Target · March 2027")}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl tabular-nums">{formatCurrency(1860, "USD")}</span>
            <span className="text-xs text-fg-muted">{t("of {amount}", { amount: formatCurrency(3000, "USD") })}</span>
          </div>
          <div className="h-px bg-border relative" aria-hidden>
            <div className="absolute inset-y-0 left-0 w-[62%] bg-celadon-strong" />
          </div>
        </div>
        <div className="surface p-5 flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium">{t("S&P 500 ETF")}</span>
            <span className="figure text-invest">+{formatCurrency(214.3, "USD")}</span>
          </div>
          <div className="divide-y divide-border">
            <Row label={t("Monthly contribution")} value={formatCurrency(200, "USD")} />
            <Row label={t("Commission")} value={formatCurrency(1, "USD")} />
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}

/* ───────────────────────────── the rest ───────────────────────────── */

function TheRest() {
  const items = [
    [t("Recurring items"), t("Salary, rent and subscriptions log themselves on schedule.")],
    [t("Shared budget"), t("Connect with a partner and both of you see and edit the same money.")],
    [t("Search and tags"), t("Find any purchase by name, amount or #tag.")],
    [t("Reconcile"), t("Match an account to your bank in one step.")],
    [t("Import and export"), t("Bring your spreadsheet in, take everything out as CSV.")],
    [t("Net worth"), t("Accounts plus investments, minus cards, month by month.")],
    [t("App lock"), t("A PIN or your fingerprint when Perch opens.")],
    [t("Undo and recover"), t("Undo a delete, or restore anything from the last 30 days.")],
    [t("English and Spanish"), t("Switch any time; amounts and dates follow.")],
  ];
  return (
    <section aria-labelledby="rest-title" className="mx-auto max-w-6xl px-4 sm:px-6 pt-24">
      <h2 id="rest-title" className="landing-h2 max-w-2xl">
        {t("And the details that make it stick.")}
      </h2>
      <dl className="mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3 border-t border-border">
        {items.map(([title, body]) => (
          <div key={title} className="py-5 border-b border-border">
            <dt className="font-serif text-lg">{title}</dt>
            <dd className="text-sm text-fg-muted mt-1 leading-relaxed">{body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ────────────────────────────── steps ─────────────────────────────── */

function Steps() {
  const steps = [
    [t("Sign in with Google"), t("No new password to remember.")],
    [t("Add your accounts"), t("Bank, savings, cash, cards: start with today's balances.")],
    [t("Log as you go"), t("A few seconds per purchase. Perch does the math.")],
  ];
  return (
    <section aria-labelledby="steps-title" className="mx-auto max-w-6xl px-4 sm:px-6 pt-24">
      <h2 id="steps-title" className="landing-h2 max-w-2xl">
        {t("Up and running in two minutes.")}
      </h2>
      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map(([title, body], i) => (
          <li key={title} className="flex gap-4">
            <span className="font-serif text-3xl leading-none text-fg-subtle tabular-nums" aria-hidden>
              {i + 1}
            </span>
            <div>
              <h3 className="text-base font-medium">{title}</h3>
              <p className="text-sm text-fg-muted mt-1 leading-relaxed">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ──────────────────────────── questions ───────────────────────────── */

function Questions() {
  const faqs: [string, string][] = [
    [
      t("Does Perch connect to my bank?"),
      t("No. You add transactions yourself, which takes seconds and means Perch never needs your bank password. You can also import a CSV from your bank or spreadsheet."),
    ],
    [
      t("Which currencies does it support?"),
      t("US dollars and Costa Rican colones. Each account and transaction keeps its own currency, and totals appear in the one you choose."),
    ],
    [
      t("Does it work without internet?"),
      t("Yes. Once you've signed in on a device, you can open Perch and log transactions offline. They sync when you're connected again."),
    ],
    [
      t("Do I need to download an app?"),
      t("No. Perch runs in your browser. On your phone you can add it to the home screen and it opens like any other app."),
    ],
    [
      t("Can I share a budget with my partner?"),
      t("Yes. Generate a code in Settings, share it, and both of you work on the same accounts and budgets."),
    ],
    [
      t("Who can see my data?"),
      t("Only you and anyone you connect with. Perch doesn't sell data or show ads. Read the privacy policy for the details."),
    ],
    [
      t("Can I leave and take my data?"),
      t("Yes. Export everything as CSV at any time, and delete your account and all its data from Settings."),
    ],
  ];
  return (
    <section id="questions" aria-labelledby="questions-title" className="mx-auto max-w-3xl px-4 sm:px-6 pt-24 scroll-mt-20">
      <h2 id="questions-title" className="landing-h2">
        {t("Questions")}
      </h2>
      <div className="rooms mt-8">
        {faqs.map(([q, a]) => (
          <details key={q} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg">
              {q}
              <span
                aria-hidden
                className="text-fg-subtle text-xl leading-none transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="text-sm text-fg-muted leading-relaxed mt-3 max-w-prose">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────────── close ─────────────────────────────── */

function Close() {
  return (
    <section aria-labelledby="close-title" className="mx-auto max-w-6xl px-4 sm:px-6 pt-24">
      <div className="courtyard surface px-6 py-14 sm:px-12 flex flex-col items-center text-center gap-5">
        <h2 id="close-title" className="landing-h2 max-w-xl">
          {t("Start with one account. See your month by Friday.")}
        </h2>
        <p className="text-fg-muted max-w-md">
          {t("Sign in, add where your money lives, and log as you go.")}
        </p>
        <SignInButton size="lg" />
      </div>
    </section>
  );
}
