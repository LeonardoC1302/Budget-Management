---
target: app/accounts/page.tsx
total_score: 21
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 2
timestamp: 2026-07-25T17-13-59Z
slug: app-accounts-page-tsx
---
# Critique: /accounts (`app/accounts/page.tsx`)

**Method:** dual-agent (Assessment A — design review sub-agent · Assessment B — detector + evidence sub-agent)

## Heuristic scores

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | No total-across-accounts; silent delete |
| 2 | Match System / Real World | 3 | `ACCOUNT_TYPE_LABELS`; currency in transfer options |
| 3 | User Control and Freedom | 1 | Row `×` calls `remove` directly — no ConfirmDialog |
| 4 | Consistency and Standards | 3 | Header pattern matches; error surface uses `.surface` |
| 5 | Error Prevention | 2 | `canDelete` gates non-empty, but empty is one-tap gone |
| 6 | Recognition Rather Than Recall | 3 | Name + type + tx count + balance |
| 7 | Flexibility and Efficiency | 2 | No reorder, no tag, no archive |
| 8 | Aesthetic and Minimalist Design | 3 | Quiet |
| 9 | Error Recovery | 2 | No undo; delete-error toast is easy to miss at top |
| 10 | Help and Documentation | n/a | Not needed |
| **Total** | | **21/36** | Below-mid; the FX transfer is a highlight, unguarded delete is the wound |

## Design specificity

`TransferForm`'s live FX conversion (`≈ X at rate Y`) is a strong multi-currency native touch found nowhere else in the market for a private budgeting PWA; the rest of the page is generic CRUD.

## Cognitive load

Low. Two header buttons (Transfer / Add), ≤2 icon actions per row. Nothing overwhelming.

## Emotional journey

No total-across-accounts to feel your net-worth breath. Delete is silent and instant on empty accounts. Transfer completes with no confirmation of new balances — the peak of the transfer moment is dropped.

## Consistency with redesigned home

Missing Masthead. Empty state is inline stub. Action icons `✎ × ↔` are ASCII where the redesigned nav uses stroke-line icons from `lib/nav/icons.tsx`.

## What's Working

- Live FX rate + converted-amount preview in `TransferForm` is the app's most confident multi-currency moment
- `canTransfer` gating with tooltip prevents an impossible action
- Error surface uses `.surface border-expense/40` — a Perch-flavored inline alert

## Priority Issues

1. **[P0] Delete has no ConfirmDialog** — Why: even with `canDelete=false` protecting non-empty accounts, an empty account is destroyed in one tap with no undo. Fix: route through the same `ConfirmDialog` used by Budgets/Goals, naming the account. Command: `/impeccable harden`
2. **[P1] No total-across-accounts tile** — Why: home shows Balance, but the page *about* accounts omits it. Fix: `BudgetSummary`-style tile with sum of USD-normalized balances plus per-currency breakdown. Command: `/impeccable shape`
3. **[P1] ASCII icon glyphs drift from stroke nav icons** — Why: visual-language inconsistency and poor glyph rendering. Fix: adopt the `lib/nav/icons.tsx` family (or a matching action-icon set). Command: `/impeccable polish`
4. **[P2] Empty state is inline stub** — Why: same drift. Fix: `EmptyState` with "Add your first account" CTA. Command: `/impeccable distill`
5. **[P2] Transfer success is silent** — Why: peak-end lost; user re-scans two balances to verify. Fix: brief inline confirmation "Transferred $X from A to B" with new balances highlighted. Command: `/impeccable delight`

## Persona Red Flags

- **Alex (power user):** No reorder, no archive; long-time users end up with a scrolling list of stale accounts.
- **Jordan (first-timer):** `↔ Transfer` and `+ Add` sit at the same weight; first-timer doesn't know which belongs to which task.
- **Sam (private multi-currency owner):** No per-currency subtotal, no USD-normalized total; FX conversion only appears inside `TransferForm`.

## Minor Observations

- `handleDelete` swallows success — no toast, no visual confirmation
- Row shows `· 3 tx` — could be "quiet" for 0 or full word for grace
- No sparkline or last-activity date per account

## Provocative Questions

- Should each account be its own tiny "perch" — a hero tile with balance and a tap-through to filtered transactions?
- Could accounts be groupable (e.g., "Household", "Personal") so 12 accounts feel like 3 nests?
- Is Transfer really a separate ceremony, or should it become a third `TransactionForm` type tab?

## Assessment B evidence

- Deterministic detector — `node .github/skills/impeccable/scripts/detect.mjs --json app/accounts/page.tsx`: **0 findings** (exit 0).
- False positives: none.
- Browser visualization: skipped — no browser MCP tool exposed in this session.
