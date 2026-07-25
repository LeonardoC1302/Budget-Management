# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Perch is a private tool for the builder and a small circle around them — a
partner, family, or a handful of trusted people who each hold their own
sign-in. Every user works inside their own per-user data tree; there is no
sharing, no household view, no collaboration surface. The situation is
personal money: quick logging on a phone during the day, and calmer
reconciliation or planning on a larger screen when the user chooses to sit
with it. There is no intent to open Perch to a general or public audience.

## Product Purpose

Perch is a personal budgeting PWA for people who want to see, decide, and log
their own money — across multiple currencies — without a dashboard shouting at
them. It exists so a small circle of related users can each track accounts,
transactions, budgets, saving goals, recurring items, and investments in one
quiet surface that installs on their device and stays under their control.
Success is a user who trusts what they see, understands where their month
stands, and returns to Perch because the act of using it feels calm rather
than taxing.

## Positioning

Five load-bearing traits, confirmed by the user, that together define what a
neighboring product could not truthfully copy:

- **Multi-currency by design, USD-normalized.** Every account and transaction
  stores both its original-currency amount and a USD-converted value. Totals,
  previews, insights, and cross-account comparisons are always presented in
  USD so figures from different currencies remain comparable. Original values
  are preserved on the entity and surfaced in details, not thrown away.
- **Manual entry only — no bank aggregation.** Perch never connects to a bank,
  card, or third-party aggregator. Every transaction is a deliberate act by
  the user. This is a positioning choice, not a limitation to fix.
- **Quiet, calm, anti-dashboard aesthetic.** Perch is deliberately not a
  performance-metrics wall. The interface exists to let money be seen, not to
  perform importance. Tone, density, and motion serve reflection over
  stimulation.
- **Mobile-first PWA, installable, offline-tolerant.** A single installable
  surface that works on a phone in the pocket and a browser on the desktop.
  There is no native store, no companion app, no split product.
- **Personal control and privacy.** Data lives per-user in Firestore, gated by
  the user's own auth. There is no aggregation, no resale of behavior, no
  third-party bank connection, and no telemetry beyond the platform floor.

## Operating Context

- **Where it runs.** A browser or an installed PWA on the user's device.
  Standalone display mode, portrait orientation, and iOS-capable
  home-screen install are already committed in the manifest and layout.
- **How it is used.** Fast logging of transactions (income, expense,
  transfer, investment) during the day; heavier reconciliation, budget
  setting, goal contributions, and recurring maintenance in slower moments.
  The mobile shell centers a bottom navigation and a bottom-anchored primary
  action; the same routes serve desktop.
- **What it depends on.** Firebase Authentication with Google Sign-In as the
  identity provider; Firestore for per-user persistence; a local-storage
  store implementation kept as a swappable seam behind `lib/storage/`. Live
  exchange rates are pulled from `open.er-api.com` and cached in-memory for
  one hour. There is no server-owned API beyond these.
- **Failure and offline posture.** The PWA is installable and expected to
  tolerate a lost connection well enough that manual entry remains possible
  in the moment and reconciles once the connection returns. This is a
  positioning commitment, not merely a nice-to-have.

## Capabilities and Constraints

Functional capabilities already in the product:

- **Accounts** in five types — debit, credit, digital wallet, cash, savings —
  each held in its own currency with an initial balance stored in both the
  original currency and USD.
- **Transactions** in four kinds — income, expense, transfer, investment —
  each carrying its original amount, USD-converted amount, currency,
  account, category, description, and date. Transfers link two accounts and
  can span currencies; a details modal shows the original amount.
- **Recurring transactions** with five frequencies — monthly, semi-monthly
  (two chosen days), weekly, biweekly, yearly — with start, optional end,
  active flag, and materialization tracking.
- **Budgets** as monthly caps per category, with progress and status
  surfaced against actual spend.
- **Saving goals** with target amount, optional target date, initial amount,
  contributions log, and a projected monthly rate.
- **Insights** on income, expense, net, and category-level breakdowns for
  the current month, shown on the dashboard.
- **Categories** are user-editable, seeded with a default set on first
  sign-in, typed as income or expense.
- **Auth and persistence.** Google Sign-In via Firebase; per-user Firestore
  tree; a local-storage store retained as a working alternative behind the
  same interface.

Durable constraints the user has locked in this round and future work must
preserve:

- **Manual entry stays.** No bank sync, no Plaid, no OFX, no aggregator —
  ever. Flows must not assume automatic ingestion.
- **USD is the normalization baseline.** All cross-currency totals, previews,
  and comparisons render in USD. Changing the baseline is a product-level
  decision, not a UI toggle.
- **PWA-first, no native app planned.** Installability via the web manifest
  is the whole native story. Do not design flows that presume a native
  iOS/Android shell, app-store distribution, or platform-specific APIs
  outside what a PWA can access.

Explicitly undecided, recorded here so future work does not silently lock
them in:

- Whether Perch ever opens to users outside the small circle. Not planned
  today.
- Whether the product ever grows a shared or household view. Not planned
  today.
- Whether a paid exchange-rate provider replaces `open.er-api.com` if
  reliability or SLA needs change.

## Brand Commitments

The following exist in the current implementation but were **not** declared as
locked commitments in this init:

- The name **Perch** and the tagline **"A quiet place for your money to
  rest."** are the incumbent identity used in `layout.tsx`, the PWA
  manifest, and the app icon. They stand until the user rebrands, and future
  work should not casually replace them; they are also not confirmed as
  final.
- The dark-only palette committed in `app/globals.css` (near-black surfaces
  with muted borders and a small semantic palette for income, expense, and
  investment) is the incumbent visual world. It is treated as current
  implementation, not a product-level ban on light or alternate themes.

Any binding change to name, tagline, or theme direction is a redesign
decision that belongs in a new-work pass, not in a refinement.

## Evidence on Hand

- The running codebase is the primary evidence: routes under `app/`, the
  atoms/molecules/organisms component tree, `lib/storage/` stores, and the
  domain types in `lib/types.ts`.
- The README at the project root describes the shipped feature set and setup.
- Exchange-rate data source: `open.er-api.com` (free tier), cached
  in-memory for one hour by `lib/services/exchangeRates.ts`.
- Firebase project configuration lives in environment variables prefixed
  `NEXT_PUBLIC_FIREBASE_*`; access is gated by the Firestore rules
  documented in the README.
- There are **no** external testimonials, press mentions, customer logos,
  case studies, benchmarks, published pricing, licensing claims, or third-
  party integrations. Future work must not fabricate any of these.

## Product Principles

1. **Quiet over spectacle.** The interface recedes so the money can be seen.
   Density, tone, and motion serve reflection, not performance.
2. **Manual is a feature.** Every entry is a deliberate act by the user; the
   product's job is to make that act fast and clear, not to remove it.
3. **Currency parity is first-class.** Multi-currency reality — original
   amounts preserved, USD used for comparison — is a foundation, not a
   toggle. No feature may quietly assume a single-currency world.
4. **Private by default.** Data stays per-user under the user's own auth.
   No aggregation, no third-party bank connection, no behavioral resale.
5. **One surface, everywhere.** A single installable PWA serves the phone,
   the tablet, and the desktop. There is no companion app and no split
   feature set by device.
