# Budget Management

A personal budgeting app for tracking accounts, transactions, budgets, and savings goals across multiple currencies. Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and Firebase.

## Features

- **Accounts** — Track balances across debit, credit, wallet, cash, and savings accounts, each in its own currency.
- **Transactions** — Log income and expenses with categories, descriptions, and dates. Delete or inspect any transaction from the history view.
- **Multi-currency with USD normalization** — Every transaction and account stores its original currency amount plus a USD-converted value. Dashboard totals, previews, and lists show USD so cross-currency figures stay comparable. Live rates are fetched from [open.er-api.com](https://open.er-api.com) and cached in-memory for one hour.
- **Search, tags and refunds** — Search the ledger by description, category, account, amount or `#tag`, and filter by period. Tag transactions (e.g. `#japan-trip`) and tap a tag to see what it adds up to by category. Record a refund against an expense; it lowers that category's spend instead of counting as income.
- **Reconcile** — Check any account or card against your bank. Perch posts a balance adjustment for the difference (not counted as income or spending) and shows when each account was last reconciled.
- **Card installments** — Split a credit-card purchase into monthly installments. The card owes the full amount right away; each month's slice lands on its own statement and budget month, and future slices are listed on the Cards page.
- **CSV import & export** — Settings → Import & export downloads every transaction as CSV and imports income/expenses from a CSV (English or Spanish headers, comma or semicolon, either number format) with a preview, duplicate detection, and a one-tap undo.
- **Transaction details modal** — Click any row on the `/transactions` page to view the full transaction with the amount in its original currency.
- **Budgets** — Set monthly caps per category and see spend progress at a glance. Step back through past months, compare the last six months against their caps on a chart, and see each category's recent months at a glance. Changing a cap keeps the old amount for earlier months.
- **Saving goals** — Create goals with target amounts and dates, log contributions, and track projected monthly rate. Withdraw from a goal when you need the money, which frees it on its account, and review each goal's contribution history.
- **Investments** — Track ETFs, indices, stocks, and crypto as first-class holdings, plus manual positions (pensions, private funds, real estate) tracked via balance entries. Live quotes and 1M–5Y history come from Twelve Data through a server-side proxy. Contributions still leave your selected account, but each holding also shows shares, cost basis, current value, and unrealized P/L. Set up recurring contributions (e.g. $200 into VOO monthly); each buy is priced at that day's close when it's recorded.
- **Insights & analytics** — Monthly income/expense/net summary plus category-level insights on the home dashboard.
- **Category management** — Add or remove income/expense categories via a dedicated modal; default categories are seeded per user on first sign-in.
- **Google Sign-In** — Firebase Authentication with Google as the identity provider.
- **Cloud persistence** — All data is stored per-user in Firebase Firestore. A local-storage store implementation is also included and can be swapped in for offline-only use.
- **Offline** — The app opens and records transactions with no connection. Firestore keeps a copy of your data on the device and syncs queued changes when the connection returns; a status line shows what's still waiting. Last known exchange and bank rates are reused while offline.
- **Undo and Recently deleted** — Deletes can be undone for a few seconds, and anything deleted stays restorable under Settings → Recently deleted for 30 days before it's removed for good.
- **Mobile-first UI** — Responsive layout with bottom-anchored actions on small screens.

## Tech stack

- [Next.js 16](https://nextjs.org) with the App Router (React Server Components + client components)
- [React 19](https://react.dev)
- [TypeScript 5](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/postcss`
- [Firebase 12](https://firebase.google.com) — Authentication and Firestore
- ESLint 9 with `eslint-config-next`

## Prerequisites

- Node.js 20 or newer
- npm (or your preferred package manager — pnpm, yarn, or bun all work)
- A Firebase project (free Spark plan is sufficient)

## Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd budget-management
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create a Firebase project**

   - Go to the [Firebase Console](https://console.firebase.google.com) and create a new project.
   - Add a **Web app** to the project (Project settings → Your apps → `</>`).
   - Copy the generated SDK config values — you will paste them into `.env.local` in the next step.

4. **Enable Firebase services**

   - **Authentication** → Sign-in method → enable **Google** and pick a project support email.
   - **Firestore Database** → create a database in production or test mode. For production, add security rules that scope reads and writes to the authenticated user (see [Security rules](#security-rules) below).

5. **Configure environment variables**

   Copy the template and fill in the values from your Firebase Web app config:

   ```bash
   cp .env.example .env.local
   ```

   See [Environment variables](#environment-variables) for details on each key.

6. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and sign in with Google. On first sign-in, a set of default categories is seeded for your user.

## Local testing without a Firebase account

`npm run dev:emulator` runs the app against the Firebase Emulator Suite (Auth + Firestore) on your machine instead of the real project. The login screen then shows **Tester A** and **Tester B** buttons under "Local emulator · test data only". Two testers exist so you can try Connections between them.

- Requires Java 11+ (`winget install EclipseAdoptium.Temurin.21.JRE`). The first run downloads the emulator binaries.
- Uses the `demo-perch` project ID. Firebase treats `demo-` projects as emulator-only, so nothing reaches the real project even if `.env.local` is filled in.
- Test data is saved to `.emulator-data/` when you stop the server and loaded on the next run. `npm run emulator:reset` wipes it.
- The Emulator UI at [http://localhost:4000](http://localhost:4000) lets you browse and edit the test data.
- `firestore.rules` is loaded by the emulator, so rule changes can be tested locally first.
- The tester buttons never render in production builds or under plain `npm run dev`.

## Environment variables

All variables are read at build time and must be prefixed with `NEXT_PUBLIC_` because they are consumed by the client-side Firebase SDK. These values are considered public Firebase config, not secrets — but Firestore access is still gated by Auth and security rules, so keep those tight.

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key from your app's SDK config. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain, typically `<project-id>.firebaseapp.com`. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket, typically `<project-id>.appspot.com`. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging sender ID. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID for the Web app. |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | (Optional) Google Analytics measurement ID. |
| `TWELVEDATA_API_KEY` | (Optional) [Twelve Data](https://twelvedata.com) API key used by the Investments tab for live ETF/stock/crypto quotes and history. Free tier is fine (800 req/day, 8/min). When unset, the Investments tab still works — holdings simply show cost basis with no market data. This key is server-only and must NOT be prefixed with `NEXT_PUBLIC_`. |

Never commit `.env.local` — it is already ignored by `.gitignore`. Use your hosting provider's secret manager (Vercel Environment Variables, etc.) in production.

## Market data (Investments tab)

Live quotes and history for holdings are proxied through Next.js route handlers under `app/api/market/*` so the API key never ships to the client. In-memory caching mirrors the FX rate cache:

- Quotes: 60s TTL, batched by symbol
- History: 10 min TTL per (symbol, range)
- Dated close (for auto-pricing contributions): 24 h TTL

Non-USD-quoted instruments (e.g. `IWDA.AS` in EUR) are converted to USD using the same live FX rate helper as the rest of the app. All portfolio totals, cost basis, and P/L are USD-normalized.

### Behind a corporate proxy (Zscaler / MITM TLS)

Node's built-in `fetch` ignores the Windows system proxy and Windows certificate store, so machines protected by Zscaler-style TLS interception can't reach Twelve Data server-side even though PowerShell and browsers work fine. If you see `ECONNRESET` from `/api/market/*`, set these in `.env.local` (adjust the URL to match your PAC file):

```
HTTPS_PROXY=http://127.0.0.1:9000
HTTP_PROXY=http://127.0.0.1:9000
NODE_TLS_REJECT_UNAUTHORIZED=0
```

The proxy vars are read on first request and passed to `undici` as the global dispatcher; `NODE_TLS_REJECT_UNAUTHORIZED=0` bypasses cert validation because the corporate MITM cert isn't in Node's trust store. This is a dev-only workaround — do not set it in production. In production the app runs against a clean egress path and needs neither.

## Security rules

The app stores everything under a per-user document tree (e.g. `users/{uid}/accounts/{id}`). A minimal Firestore rule set that enforces this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Adjust to your needs before enabling any additional collections.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on port 3000. |
| `npm run build` | Create a production build. |
| `npm start` | Serve the production build. |
| `npm run lint` | Run ESLint across the project. |

## Project structure

```
app/           Next.js App Router pages (home, transactions, accounts, budgets, goals, add)
components/    UI components (atoms, molecules, organisms)
contexts/      React context providers (auth, categories)
hooks/         Feature hooks (useAccounts, useTransactions, useBudgets, useGoals, useCategories)
lib/
  firebase/    Firebase client, auth helpers, per-user seeding
  services/    exchangeRates.ts — live FX rates from open.er-api.com
               marketData.ts    — Twelve Data proxy (quotes, history, search)
  storage/     Store interfaces + Firebase and local-storage implementations
  types.ts     Shared domain types
  utils/       Formatting, analytics, currency, cn helpers
public/        Static assets
```

The per-user Firestore tree now also stores `holdings` and `holdingValuations` — the security rule above already covers them because it matches `users/{userId}/{document=**}`.

## Switching to local storage

`lib/storage/index.ts` is the single seam that selects the persistence backend. Swap the exported stores from `firebase*Store` to `local*Store` to run the app entirely against `localStorage` (useful for offline demos or development without Firebase).

## Deployment

The app deploys cleanly to [Vercel](https://vercel.com) — connect the repo, add the `NEXT_PUBLIC_FIREBASE_*` environment variables (plus `TWELVEDATA_API_KEY` if you want the Investments tab's live prices) in the project settings, and deploy. Any host that supports Next.js 16 works; see the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for other targets.

## Notes

- This project uses a customized Next.js 16 setup. Check `AGENTS.md` and `node_modules/next/dist/docs/` for framework specifics before making structural changes.
- Exchange rates are fetched from open.er-api.com's free endpoint. If you expect heavy usage or need SLAs, swap `lib/services/exchangeRates.ts` for a paid provider.
- Market data (Investments tab) uses Twelve Data's free tier via a Next.js route proxy. Free tier limits are 800 requests/day and 8/min — plenty for a private tool. Missing keys degrade the tab to cost-basis-only mode; nothing crashes.
