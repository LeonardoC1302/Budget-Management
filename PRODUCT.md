# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Perch is a public personal finance app for people in Costa Rica who handle
money in both colones and US dollars. Anyone with a Google account can sign
in from the landing page at `/`. Each user works inside their own per-user
data tree. Users can connect with a one-time code and then see and edit
each other's data (typically a couple sharing a household budget); there is
no wider collaboration surface.

The situation is personal money: quick logging on a phone during the day,
often with a weak or missing connection, and calmer reconciliation or
planning on a larger screen when the user chooses to sit with it. The app
and its public pages are available in English and Costa Rican Spanish.

## Product Purpose

Perch is a personal budgeting PWA for people who want to see, decide, and log
their own money across colones and dollars without a dashboard shouting at
them. Users track accounts, credit cards, transactions, budgets, saving
goals, recurring items and investments in one quiet surface that installs on
their device and keeps working offline. Success is a user who trusts what
they see, understands where their month stands, and returns to Perch because
using it feels calm rather than taxing.

## Positioning

Five traits that together define what a neighboring product could not
truthfully copy:

- **Colones and dollars by design.** Every account and transaction keeps its
  original-currency amount alongside a USD-normalized value. Totals,
  insights and charts are computed in USD and shown in the user's chosen
  display currency (USD or CRC). Costa Rican bank window rates (compra and
  venta) are built in, and a purchase can carry the exact rate the bank
  used.
- **Manual entry only, no bank aggregation.** Perch never connects to a
  bank, card or aggregator and never asks for bank credentials. Every
  transaction is a deliberate act by the user, helped by recurring items and
  CSV import. This is a positioning choice, not a limitation to fix.
- **Quiet, calm, anti-dashboard aesthetic.** The interface lets money be
  seen instead of performing importance. Tone, density and motion serve
  reflection over stimulation.
- **Mobile-first PWA that works offline.** One installable surface for the
  phone and the desktop. Firestore keeps a local copy, so logging works
  without signal and syncs later. There is no native store app.
- **Personal control and privacy.** Data lives per user in Firestore behind
  the user's own sign-in. No ads, no analytics cookies, no data resale. Users
  can export everything as CSV and delete their account and data themselves.

## Operating Context

- **Where it runs.** A browser or an installed PWA. Standalone display,
  portrait orientation and iOS home-screen install are set in the manifest.
  The manifest `id` is pinned to `/` so installs made before the landing
  page existed stay the same app; `start_url` is `/home`.
- **Routes.** Public pages live in the `app/(public)` group: the landing
  page (`/`), `/privacy` and `/terms`. They are indexed by search engines and
  listed in `sitemap.xml`. The signed-in app lives in `app/(app)` (`/home`,
  `/transactions`, `/budgets`, …) and is marked `noindex`. A signed-in
  visitor to `/` is sent to `/home` unless the URL carries `?stay`.
- **How it is used.** Fast logging of income, expenses, transfers and
  investment contributions during the day; reconciliation, budget setting,
  goal contributions and recurring maintenance in slower moments. Mobile
  uses a bottom menu pill; desktop shows the full navigation row.
- **What it depends on.**
  - Firebase Authentication with Google Sign-In.
  - Firestore with persistent local cache for per-user data.
  - The Banco Central de Costa Rica's economic data API (SDDE) for every
    exchange rate (needs `BCCR_SDDE_TOKEN`): general conversions via
    `/api/rates/usd` (table 520) and each institution's window rates via
    `/api/rates/bccr` (table 1015).
  - Twelve Data for market prices, via `/api/market/*`.
  - Every `/api` route requires a Firebase ID token, verified server-side
    with `jose` against Google's public keys.
- **Failure and offline posture.** Manual entry must keep working without a
  connection and reconcile once it returns. The last known rates are reused
  while offline. Account deletion is the one flow that requires a
  connection.

## Capabilities and Constraints

Functional capabilities in the product:

- **Accounts** in five types (debit, credit, digital wallet, cash, savings),
  each in USD or CRC, with reconciliation against the bank balance.
- **Credit cards** with cut and payment days, statement view, credit left,
  payments of the statement or of chosen charges, and purchases split into
  monthly installments.
- **Transactions** (income, expense, transfer, investment) with original and
  USD amounts, category, description, date, `#tags`, refunds that lower
  spending, search and period filters.
- **Recurring items** (monthly, semi-monthly, weekly, biweekly, yearly) for
  income, expenses and investment contributions.
- **Budgets** as monthly caps per category, with month navigation and a
  six-month history chart. Changing a cap keeps earlier months' amounts.
- **Saving goals** with contributions, withdrawals and a projected monthly
  rate.
- **Investments as holdings**: market holdings priced from Twelve Data and
  manual holdings updated by hand. Contributions can carry a broker
  commission that counts toward cost basis.
- **Insights**: monthly income, expense and net; category breakdowns; net
  worth over twelve months; savings rate.
- **Connections**: users share each other's data after exchanging a
  one-time code.
- **Data tools**: CSV import and export, undo on delete, and a 30-day
  Recently deleted bin.
- **App lock**: per-device PIN plus fingerprint or face unlock (WebAuthn).
- **Onboarding** for new users: language, display currency and first
  accounts. Existing users never see it.
- **Account deletion** from Settings → Delete account: reauthenticates, then
  removes all user data, connections, the profile and the auth user.
- **Public site**: landing page, privacy policy and terms (English and
  Spanish), 404 and error pages, `robots.txt`, `sitemap.xml`, Open Graph
  image and JSON-LD.

Durable constraints future work must preserve:

- **Existing users' data is never lost or rewritten.** New fields are
  optional and old documents keep working. Migrations that modify stored
  data need an explicit decision.
- **Manual entry stays.** No bank sync, no Plaid, no OFX, no aggregator.
  Flows must not assume automatic ingestion.
- **USD is the storage baseline.** Amounts are normalized to USD for
  storage and comparison; the display currency is a view preference.
  Changing the storage baseline is a product-level decision.
- **PWA-first, no native app planned.** Do not design flows that need a
  native shell, app-store distribution or APIs a PWA can't reach.
- **Legal pages track the code.** When a data flow changes (a new
  provider, analytics, payments), update `lib/legal/` in the same change.

Explicitly undecided, recorded so future work does not silently lock it in:

- Pricing. Perch may become freemium. Public copy must not promise that it
  is free; the terms say paid features may come with notice.
- The final name and domain. "Perch" has not been checked for trademark or
  store conflicts, and there is no custom domain yet.
- Whether a paid exchange-rate or market-data provider replaces the free
  tiers if reliability or quota needs change.
- Hardening deferred for later: Firebase App Check and bot blocking, a
  Content-Security-Policy header, and operational monitoring.

## Brand Commitments

- The name **Perch** and the tagline **"A quiet place for your money to
  rest."** appear in the metadata, manifest, landing page, Open Graph image
  and app icon. They stand until the user rebrands; see the undecided name
  check above.
- The visual world is **Alcove**, described in `DESIGN.md`: light and dark
  themes, celadon accent, Newsreader serif display over Geist sans. Any
  binding change to name, tagline or visual direction is a redesign
  decision that belongs in a new-work pass, not in a refinement.
- The operator is an individual developer based in Costa Rica. The legal
  pages say so; the contact email is still a placeholder.

## Evidence on Hand

- The running codebase: routes under `app/`, the atoms/molecules/organisms
  component tree, stores in `lib/storage/`, domain types in `lib/types.ts`.
- The README describes the shipped features, setup and deployment.
- Legal text lives in `lib/legal/`, with `[CONTACT EMAIL]` and
  `[FIRESTORE REGION]` placeholders in `lib/legal/types.ts`.
- Rate and price sources: the BCCR SDDE API (table 520 for general
  rates, table 1015 for window rates) and Twelve Data's free tier (800 requests/day,
  8/min) behind `TWELVEDATA_API_KEY`. Without that key, investments fall
  back to cost basis only.
- There are **no** testimonials, user counts, press mentions, customer
  logos, case studies, benchmarks, published pricing or third-party
  integrations. The landing page's previews use labeled sample data. Future
  work must not invent any of these.

## Product Principles

1. **Quiet over spectacle.** The interface recedes so the money can be seen.
   Density, tone and motion serve reflection, not performance.
2. **Manual is a feature.** Every entry is a deliberate act; the product's
   job is to make that act fast and clear, not to remove it.
3. **Two currencies are first-class.** Original amounts are preserved and
   USD is used for comparison. No feature may quietly assume a
   single-currency world.
4. **Private by default.** Data stays per user under the user's own sign-in,
   is exportable, and can be deleted by the user.
5. **One surface, everywhere.** A single installable PWA serves the phone,
   the tablet and the desktop, online or not.
