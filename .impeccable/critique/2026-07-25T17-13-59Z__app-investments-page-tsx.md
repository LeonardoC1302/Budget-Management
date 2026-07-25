---
target: app/investments/page.tsx
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-07-25T17-13-59Z
slug: app-investments-page-tsx
---
# Critique: /investments (`app/investments/page.tsx`)

**Method:** dual-agent (Assessment A — design review sub-agent · Assessment B — detector + evidence sub-agent)

## Heuristic scores

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | "Total invested" + count are prominent |
| 2 | Match System / Real World | 3 | "Portfolio", "By category" |
| 3 | User Control and Freedom | 2 | Manage hidden until categories exist; no add-shortcut |
| 4 | Consistency and Standards | 3 | Header pattern matches; `TransactionList` reused |
| 5 | Error Prevention | 2 | Inherits `TransactionList`'s row-delete-no-confirm |
| 6 | Recognition Rather Than Recall | 3 | Name + amount + share bar per row |
| 7 | Flexibility and Efficiency | 2 | Only "By category" — no time-series, no per-account |
| 8 | Aesthetic and Minimalist Design | 3 | Amber accent applied confidently |
| 9 | Error Recovery | 2 | Same delete-no-undo inheritance |
| 10 | Help and Documentation | 2 | "Create at least one investment category" is decent guidance |
| **Total** | | **25/40** | Mid-band; strong per-page identity, missing the time dimension |

## Design specificity

Amber `text-invest` color-coding + Total tile + share-bar breakdown is more product-specific than most routes; the two-level empty state (no categories → create; categories but no txs → hint) is nicely worked.

## Cognitive load

Low. But the "+ Add" text link in the Activity header competes with the header-level `Manage` button — inconsistent affordance weights create small decisions.

## Emotional journey

The "Total invested" number is quietly proud. Empty states are functional but flat. No sense of progression over time — investing is inherently temporal, and the page is a snapshot.

## Consistency with redesigned home

Missing Masthead. Uses an inline `surface p-6 flex flex-col` instead of `EmptyState` atom for the no-categories case. Activity's `+ Add` text link is a third variant of the Add affordance across the app.

## What's Working

- Amber accent applied consistently to total, share bars, and row icons
- Two-level empty state distinguishes "no categories" from "no transactions"
- Share-bar breakdown gives instant portfolio composition at a glance

## Priority Issues

1. **[P1] Three inconsistent "Add" affordances across the app** — Why: header `Button + Add`, text-link `+ Add`, and Add nav tab all coexist. Fix: standardize on the header `Button + Add` pattern and remove the Activity text link. Command: `/impeccable distill`
2. **[P1] No time-series** — Why: investments is the one place a contribution line chart would matter; a `SavingsLineChart` atom already exists. Fix: reuse `SavingsLineChart` above the breakdown. Command: `/impeccable shape`
3. **[P2] Category empty state ignores `EmptyState` atom** — Why: drift. Fix: swap for `EmptyState` with a "New investment category" CTA. Command: `/impeccable distill`
4. **[P2] Row-level delete inherits no-confirm bug** — Why: same P0 as `/transactions`, propagated. Fix: same fix — route through details modal or ConfirmDialog. Command: `/impeccable harden`
5. **[P3] `Manage` button vanishes when categories are empty** — Why: first-timer can't discover the manage UI. Fix: keep `Manage` visible with an appropriate inner empty state. Command: `/impeccable clarify`

## Persona Red Flags

- **Alex (power user):** No time filter (this year / last 12 months) — the total tile is life-to-date only, with no way to see the current year's contribution rhythm.
- **Jordan (first-timer):** Hits the "No investment categories yet" gate and has to reason about what an "investment category" is before their first entry.
- **Sam (private multi-currency owner):** Total is USD with no note about normalization; no per-currency subtotals; contributions from a ¥ or € account disappear into the amber number.

## Minor Observations

- Share bar rounds to 0% for tiny holdings, hiding them visually
- `emptyMessage` intelligently varies by state ("from the Add tab" vs plain)
- `CategoryManageModal` behavior is invisible from this page — trust required

## Provocative Questions

- Should Investments surface a "contribution rhythm" — six months of monthly contributions feels like a habit, not a portfolio?
- Could the amber carry a slow ambient pulse when a new contribution lands?
- Is a category-first architecture the right frame, or would per-holding entries (VTI, VOO) be more human?

## Assessment B evidence

- Deterministic detector — `node .github/skills/impeccable/scripts/detect.mjs --json app/investments/page.tsx`: **0 findings** (exit 0).
- False positives: none.
- Browser visualization: skipped — no browser MCP tool exposed in this session.
