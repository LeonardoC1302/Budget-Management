# Budget Management

A personal budgeting app for tracking accounts, transactions, budgets, and savings goals across multiple currencies. Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and Firebase.

## Features

- **Accounts** — Track balances across debit, credit, wallet, cash, and savings accounts, each in its own currency.
- **Transactions** — Log income and expenses with categories, descriptions, and dates. Delete or inspect any transaction from the history view.
- **Multi-currency with USD normalization** — Every transaction and account stores its original currency amount plus a USD-converted value. Dashboard totals, previews, and lists show USD so cross-currency figures stay comparable. Live rates are fetched from [open.er-api.com](https://open.er-api.com) and cached in-memory for one hour.
- **Transaction details modal** — Click any row on the `/transactions` page to view the full transaction with the amount in its original currency.
- **Budgets** — Set monthly caps per category and see spend progress at a glance.
- **Saving goals** — Create goals with target amounts and dates, log contributions, and track projected monthly rate.
- **Insights & analytics** — Monthly income/expense/net summary plus category-level insights on the home dashboard.
- **Category management** — Add or remove income/expense categories via a dedicated modal; default categories are seeded per user on first sign-in.
- **Google Sign-In** — Firebase Authentication with Google as the identity provider.
- **Cloud persistence** — All data is stored per-user in Firebase Firestore. A local-storage store implementation is also included and can be swapped in for offline-only use.
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

Never commit `.env.local` — it is already ignored by `.gitignore`. Use your hosting provider's secret manager (Vercel Environment Variables, etc.) in production.

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
  storage/     Store interfaces + Firebase and local-storage implementations
  types.ts     Shared domain types
  utils/       Formatting, analytics, currency, cn helpers
public/        Static assets
```

## Switching to local storage

`lib/storage/index.ts` is the single seam that selects the persistence backend. Swap the exported stores from `firebase*Store` to `local*Store` to run the app entirely against `localStorage` (useful for offline demos or development without Firebase).

## Deployment

The app deploys cleanly to [Vercel](https://vercel.com) — connect the repo, add the `NEXT_PUBLIC_FIREBASE_*` environment variables in the project settings, and deploy. Any host that supports Next.js 16 works; see the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for other targets.

## Notes

- This project uses a customized Next.js 16 setup. Check `AGENTS.md` and `node_modules/next/dist/docs/` for framework specifics before making structural changes.
- Exchange rates are fetched from open.er-api.com's free endpoint. If you expect heavy usage or need SLAs, swap `lib/services/exchangeRates.ts` for a paid provider.
