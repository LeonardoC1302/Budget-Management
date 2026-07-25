---
target: app/budgets/page.tsx
total_score: 26
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
timestamp: 2026-07-25T17-13-59Z
slug: app-budgets-page-tsx
---
# Critique: /budgets (`app/budgets/page.tsx`)

**Method:** dual-agent (Assessment A — design review sub-agent · Assessment B — detector + evidence sub-agent)

## Heuristic scores

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Monthly period labeled; loading text acceptable |
| 2 | Match System / Real World | 3 | "Monthly cap", "X of Y" reads plainly |
| 3 | User Control and Freedom | 3 | Edit modal + ConfirmDialog on delete |
| 4 | Consistency and Standards | 3 | `BudgetRow` matches home preview |
| 5 | Error Prevention | 3 | ConfirmDialog names the category, reassures txs untouched |
| 6 | Recognition Rather Than Recall | 3 | Name + %+ remaining all visible |
| 7 | Flexibility and Efficiency | 2 | No month nav, no copy-from-last-month |
| 8 | Aesthetic and Minimalist Design | 3 | Clean and breathable |
| 9 | Error Recovery | 3 | ConfirmDialog is the recovery |
| 10 | Help and Documentation | n/a | Not needed on this surface |
| **Total** | | **26/36** | Upper-mid; already inherits home's polish, biggest gap is time dimension |

## Design specificity

The over-cap reassurance line ("Recorded. You can raise the cap or trim spending anytime in Budgets") is textbook Perch voice; the rest is a competent generic budgeting page.

## Cognitive load

Low. Add button + list; no >4-option decision. Only friction: no sort or grouping when the list grows past ~8 categories.

## Emotional journey

`ConfirmDialog` + row-level reassurance are the strongest emotional touches outside home. But there's no celebration for being under-cap late in the month — only warnings when things go wrong.

## Consistency with redesigned home

`BudgetRow` matches. Missing: Masthead identity, `EmptyState` atom (inline stub used), no `DeltaPill` for month-over-month, no roost-line signature on `BudgetSummary`.

## What's Working

- `BudgetSummary` uncapped-spend footnote quietly educates instead of scolding
- `ConfirmDialog` copy names the category and protects transactions
- Over-cap row line is the redesigned home's voice, distilled

## Priority Issues

1. **[P1] No previous-month navigation** — Why: Sam can't review last month; Alex can't compare month-over-month. Fix: month arrows on the `label-sm` beside "Budgets"; read-only for past. Command: `/impeccable shape`
2. **[P1] Empty state is inline stub** — Why: drift from home; misses warm framing and CTA button. Fix: swap to `EmptyState` with `actionLabel="Add a monthly cap"`. Command: `/impeccable distill`
3. **[P2] `+ Add` disabled reason only visible inside modal** — Why: "Every expense category already has a budget" hides behind a click. Fix: surface hint on button hover / disable it visually with copy. Command: `/impeccable clarify`
4. **[P2] Cap is USD-only in `BudgetForm`** — Why: contradicts the multi-currency ethos; Sam's €-heavy account can't have a €-cap. Fix: per-budget currency picker defaulting to USD. Command: `/impeccable adapt`
5. **[P3] No "on pace for month-end" projection** — Why: home shows monthly rhythm; this page treats spend as an instant. Fix: subtle pace pill per row ("On pace to end +$40 under"). Command: `/impeccable delight`

## Persona Red Flags

- **Alex (power user):** No copy-from-last-month or bulk edit — starting a new month is a fully manual re-entry.
- **Jordan (first-timer):** "Add a new category first" hint appears only inside the modal, after tapping Add on an already-full list.
- **Sam (private multi-currency owner):** Cap hard-coded to `BASE_CURRENCY`; multi-currency owners can only reason in normalized dollars.

## Minor Observations

- `BudgetSummary` uses `budgets[0]?.currency` — assumes homogeneous currency
- No sort control on `BudgetList` — always order-of-creation
- `ConfirmDialog` `confirmLabel="Delete"` has no destructive-style hint visible from this page

## Provocative Questions

- What if Budgets were a monthly ledger you could flip through like a paper diary?
- Could over-cap rows offer a one-tap "raise cap by the overage" chip inside the reassurance line?
- Should each row carry a tiny sparkline of spend-vs-cap across the month?

## Assessment B evidence

- Deterministic detector — `node .github/skills/impeccable/scripts/detect.mjs --json app/budgets/page.tsx`: **0 findings** (exit 0).
- False positives: none.
- Browser visualization: skipped — no browser MCP tool exposed in this session.
