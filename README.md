# Budget Management (Perch)

Perch is a personal budgeting app for tracking accounts, credit cards, transactions, budgets, savings goals and investments in US dollars and Costa Rican colones. It has a public landing page at `/` and the signed-in app at `/home`. Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and Firebase.

## Features

- **Accounts** — Track balances across debit, credit, wallet, cash, and savings accounts, each in its own currency.
- **Transactions** — Log income and expenses with categories, descriptions, and dates. Delete or inspect any transaction from the history view.
- **USD and CRC with USD normalization** — Every transaction and account stores its original currency amount plus a USD-converted value. Totals are computed in USD and shown in the display currency you pick (USD or CRC). General rates come from [open.er-api.com](https://open.er-api.com), cached for one hour; Costa Rican bank window rates (compra/venta) come from the Banco Central de Costa Rica's economic data API (SDDE) through `/api/rates/bccr`, and a purchase can store the exact rate your bank used.
- **Credit cards** — Cut and payment days, the current statement, credit left, and payments of the full statement or of chosen charges.
- **Search, tags and refunds** — Search the ledger by description, category, account, amount or `#tag`, and filter by period. Tag transactions (e.g. `#japan-trip`) and tap a tag to see what it adds up to by category. Record a refund against an expense; it lowers that category's spend instead of counting as income.
- **Reconcile** — Check any account or card against your bank. Perch posts a balance adjustment for the difference (not counted as income or spending) and shows when each account was last reconciled.
- **Card installments** — Split a credit-card purchase into monthly installments. The card owes the full amount right away; each month's slice lands on its own statement and budget month, and future slices are listed on the Cards page.
- **CSV import & export** — Settings → Import & export downloads every transaction as CSV and imports income/expenses from a CSV (English or Spanish headers, comma or semicolon, either number format) with a preview, duplicate detection, and a one-tap undo.
- **Transaction details modal** — Click any row on the `/transactions` page to view the full transaction with the amount in its original currency.
- **Budgets** — Set monthly caps per category and see spend progress at a glance. Step back through past months, compare the last six months against their caps on a chart, and see each category's recent months at a glance. Changing a cap keeps the old amount for earlier months.
- **Saving goals** — Create goals with target amounts and dates, log contributions, and track projected monthly rate. Withdraw from a goal when you need the money, which frees it on its account, and review each goal's contribution history.
- **Investments** — Track ETFs, indices, stocks, and crypto as first-class holdings, plus manual positions (pensions, private funds, real estate) tracked via balance entries. Live quotes and 1M–5Y history come from Twelve Data through a server-side proxy. Contributions still leave your selected account, but each holding also shows shares, cost basis, current value, and unrealized P/L. Set up recurring contributions (e.g. $200 into VOO monthly); each buy is priced at that day's close when it's recorded. Contributions can include a broker commission (e.g. IBKR): the account pays amount + commission, shares are bought with the amount, and the commission counts toward cost basis. The last commission used for a holding is prefilled.
- **Insights & analytics** — Monthly income/expense/net summary plus category-level insights on the home dashboard.
- **Net worth over time** — Twelve months of month-end net worth: account balances plus investments (month-end close, or latest valuation for manual holdings) minus what's owed on cards.
- **Savings rate** — The share of each month's income you kept, with this month's rate and the income-weighted average.
- **Connections** — Share your data with people you trust (e.g. a partner) by exchanging a one-time code under Settings → Connections. Connected users can see and edit each other's accounts and budgets.
- **Category management** — Add or remove income/expense categories via a dedicated modal; default categories are seeded per user on first sign-in.
- **Google Sign-In** — Firebase Authentication with Google as the identity provider.
- **Cloud persistence** — All data is stored per-user in Firebase Firestore. A local-storage store implementation is also included and can be swapped in for offline-only use.
- **Offline** — The app opens and records transactions with no connection. Firestore keeps a copy of your data on the device and syncs queued changes when the connection returns; a status line shows what's still waiting. Last known exchange and bank rates are reused while offline.
- **Undo and Recently deleted** — Deletes can be undone for a few seconds, and anything deleted stays restorable under Settings → Recently deleted for 30 days before it's removed for good.
- **English and Spanish** — Switch language in Settings; the choice follows you across devices. Spanish formats money and dates the Costa Rican way. Strings live in `lib/i18n/es.ts`, keyed by the English text passed to `t()`.
- **App lock** — Optional PIN, plus fingerprint or face unlock where the device supports it (WebAuthn), set per device under Settings → App lock. It's a screen lock, not encryption.
- **Onboarding** — New users pick a language and display currency and add their own accounts; there's no default cash account any more. Existing users never see it.
- **Delete account** — Settings → Delete account asks you to sign in again, then deletes all your data, your connections and codes, your profile, and your Firebase Auth user.
- **Public site** — Landing page, privacy policy and terms of service (English and Spanish, following the browser language), 404 and error pages, `robots.txt`, `sitemap.xml`, an Open Graph image and JSON-LD. Signed-in visitors to `/` are sent to `/home` unless the URL has `?stay`.
- **Light and dark themes** — Follows the system by default; the toggle saves the choice per device.
- **Mobile-first UI** — Responsive layout with bottom-anchored actions on small screens.

## Tech stack

- [Next.js 16](https://nextjs.org) with the App Router (React Server Components + client components)
- [React 19](https://react.dev)
- [TypeScript 5](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/postcss`
- [Firebase 12](https://firebase.google.com) — Authentication and Firestore
- [jose](https://github.com/panva/jose) — verifies Firebase ID tokens on the API routes
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

   Open [http://localhost:3000](http://localhost:3000) to see the landing page, then sign in with Google to reach the app at `/home`. New users go through a short onboarding and get a default set of categories.

## Local testing without a Firebase account

`npm run dev:emulator` runs the app against the Firebase Emulator Suite (Auth + Firestore) on your machine instead of the real project. The login screen then shows **Tester A** and **Tester B** buttons under "Local emulator · test data only". Two testers exist so you can try Connections between them.

- Requires Java 11+ (`winget install EclipseAdoptium.Temurin.21.JRE`). The first run downloads the emulator binaries.
- Uses the `demo-perch` project ID. Firebase treats `demo-` projects as emulator-only, so nothing reaches the real project even if `.env.local` is filled in.
- Test data is saved to `.emulator-data/` when you stop the server and loaded on the next run. `npm run emulator:reset` wipes it.
- The Emulator UI at [http://localhost:4000](http://localhost:4000) lets you browse and edit the test data.
- `firestore.rules` is loaded by the emulator, so rule changes can be tested locally first.
- The tester buttons never render in production builds or under plain `npm run dev`.

## Environment variables

The `NEXT_PUBLIC_` variables are read at build time and shipped to the browser. The Firebase ones are public config, not secrets; Firestore access is still gated by Auth and security rules, so keep those tight.

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
| `BCCR_SDDE_TOKEN` | Token for the [BCCR economic data API](https://www.bccr.fi.cr/indicadores-economicos/servicio-web), used for each institution's window buy/sell rates (table 1015). Register at the BCCR economic indicators site and generate it under Mi Perfil → Generar token. Server-only. When unset or rejected, the bank picker is unavailable and conversions fall back to open.er-api.com. |
| `NEXT_PUBLIC_SITE_URL` | (Optional) Public base URL, e.g. `https://perch.example`. Used for canonical links, Open Graph URLs, `robots.txt` and `sitemap.xml`. When empty, Vercel's production URL is used, then `http://localhost:3000`. |

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

The app stores everything under a per-user document tree (e.g. `users/{uid}/accounts/{id}`). The rules in [`firestore.rules`](firestore.rules) let each user read and write their own tree, let a connected user in through a grant, and cover the `connections` and `connectionCodes` collections used for sharing. Deploy them with the Firebase CLI (`firebase deploy --only firestore:rules`); the emulator loads the same file.

The API routes under `app/api/` require a Firebase ID token (`Authorization: Bearer <token>`), which `lib/server/requireUser.ts` verifies against Google's public keys. Client code calls them through `lib/api/apiFetch.ts`, which attaches the token.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on port 3000. |
| `npm run dev:emulator` | Start the dev server against the local Firebase emulators, with tester sign-in buttons. |
| `npm run emulator:reset` | Delete the saved emulator data in `.emulator-data/`. |
| `npm run build` | Create a production build. |
| `npm start` | Serve the production build. |
| `npm run lint` | Run ESLint across the project. |

## Project structure

```
app/
  (public)/    Landing page, /privacy, /terms (indexed)
  (app)/       The signed-in app: /home, /transactions, /budgets, /settings, ... (noindex)
  api/         Market data and bank-rate proxies (auth required)
  robots.ts, sitemap.ts, opengraph-image.tsx, manifest.ts
  not-found.tsx, error.tsx, global-error.tsx
components/
  atoms/, molecules/, organisms/   App UI
  public/      Landing page, public shell, legal and status pages
contexts/      Auth, access, categories, language, preferences
hooks/         Data hooks (accounts, transactions, budgets, goals, holdings, ...) and offline sync
lib/
  firebase/    Client, auth, seeding, connections, account deletion
  i18n/        t()/tn() and the Spanish dictionary (es.ts)
  legal/       Privacy policy and terms text, with placeholders in types.ts
  site/        siteUrl() for metadata, robots and sitemap
  server/      Server-side ID token verification
  services/    Exchange rates, bank rates, Twelve Data
  storage/     Store interfaces + Firebase and local-storage implementations
  types.ts     Shared domain types
public/        Static assets and the service worker (sw.js)
```

`DESIGN.md` describes the visual system and `PRODUCT.md` the product scope and constraints.

## Switching to local storage

`lib/storage/index.ts` is the single seam that selects the persistence backend. Swap the exported stores from `firebase*Store` to `local*Store` to run the app entirely against `localStorage` (useful for offline demos or development without Firebase).

## Deployment

The app deploys to [Vercel](https://vercel.com): connect the repo, add the `NEXT_PUBLIC_FIREBASE_*` environment variables (plus `TWELVEDATA_API_KEY` for live prices and `BCCR_SDDE_TOKEN` for bank window rates) in the project settings, and deploy. Any host that supports Next.js 16 works; see the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for other targets.

When you add a custom domain:

1. Set `NEXT_PUBLIC_SITE_URL` to it and redeploy.
2. Add it under Firebase Console → Authentication → Settings → Authorized domains, or Google sign-in fails there.
3. Verify it in Google Search Console and submit `/sitemap.xml`.

Before going public, fill in `[CONTACT EMAIL]` and `[FIRESTORE REGION]` in `lib/legal/types.ts`.

## Notes

- This project uses a customized Next.js 16 setup. Check `AGENTS.md` and `node_modules/next/dist/docs/` for framework specifics before making structural changes.
- Exchange rates are fetched from open.er-api.com's free endpoint. If you expect heavy usage or need SLAs, swap `lib/services/exchangeRates.ts` for a paid provider.
- Market data (Investments tab) uses Twelve Data's free tier via a Next.js route proxy. Free tier limits are 800 requests/day and 8/min; switch to a paid plan if usage grows. Missing keys degrade the tab to cost-basis-only mode; nothing crashes.
