---
target: app/transactions/page.tsx
total_score: 18
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 2
timestamp: 2026-07-25T17-13-58Z
slug: app-transactions-page-tsx
---
# Critique: /transactions (`app/transactions/page.tsx`)

**Method:** dual-agent (Assessment A — design review sub-agent · Assessment B — detector + evidence sub-agent)

## Heuristic scores

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | "Loading…" text stub; no filtered count |
| 2 | Match System / Real World | 3 | "History" / "All transactions" are clear |
| 3 | User Control and Freedom | 2 | Only category filter; row `×` deletes instantly |
| 4 | Consistency and Standards | 2 | Empty stub isn't `EmptyState`; no Masthead |
| 5 | Error Prevention | 1 | Row-level delete has no confirm dialog |
| 6 | Recognition Rather Than Recall | 3 | Pills + date grouping recognizable |
| 7 | Flexibility and Efficiency | 1 | No search, no date/type/account filters |
| 8 | Aesthetic and Minimalist Design | 3 | Fade-out gradient is a nice quiet detail |
| 9 | Error Recovery | 1 | Delete is one-tap, no undo |
| 10 | Help and Documentation | n/a | Log surface — help isn't the job |
| **Total** | | **18/36** | Below-band; primary friction is destructive-action fragility and no power-user filter surface |

## Design specificity

Only the pill row's right-side fade gradient feels authored for Perch; the list itself could ship in any budgeting app unchanged.

## Cognitive load

Low intrinsic load, but the always-visible row `×` adds unnecessary destructive decisions to a browsing task; no >4-option control is visible.

## Emotional journey

Nothing peak, nothing warm — delete is instant with no confirmation and empty states are terse; a browsing surface should feel like flipping a ledger, not scanning a table.

## Consistency with redesigned home

Missing Masthead identity, missing `EmptyState` atom, missing ambient-depth loading skeleton — this route reads plainer than any home section.

## What's Working

- Right-edge fade gradient on the pill scroller is a Perch-native detail
- Date grouping via `formatDateHeader` gives the log human rhythm
- Details modal keeps destructive actions off the row for taps that go through it

## Priority Issues

1. **[P0] Row-level `×` delete with no confirm** — Why: single-tap loss of history contradicts "a quiet place for your money to rest". Fix: hide the row delete; reserve destruction for the details modal or a `ConfirmDialog`. Command: `/impeccable harden`
2. **[P1] No search / date / type filters** — Why: Alex can't find a `$` figure or scope to one account in a growing log. Fix: add a search input above the pills plus a type/account chip row. Command: `/impeccable clarify`
3. **[P1] "Loading…" text placeholder** — Why: breaks the ambient depth of the redesigned home. Fix: ship row-height skeletons inside the `surface` container. Command: `/impeccable polish`
4. **[P2] Empty stub ignores `EmptyState` atom** — Why: home reads warm, this reads terse. Fix: swap for `EmptyState` with a soft sentence and a link to `/add`. Command: `/impeccable distill`
5. **[P2] No brand anchor on a deep route** — Why: Jordan lands via back button and loses context. Fix: introduce a slim masthead variant (wordmark + section label) for deeper routes. Command: `/impeccable shape`

## Persona Red Flags

- **Alex (power user):** No search field, no keyboard shortcut, no multi-filter — the only affordance in a list that will grow to thousands of rows is a horizontal pill scroller.
- **Jordan (first-timer):** The always-visible `×` beside every row invites misfire; nothing explains what tapping a row does.
- **Sam (private multi-currency owner):** Every amount is silently USD-normalized; original currency only appears after opening the details modal.

## Minor Observations

- Investments are filtered out with no signpost pointing to `/investments`
- Pill fade exists only on the right edge; scrolled-past is invisible on the left
- No sort control — always reverse-chronological

## Provocative Questions

- Could the pill row become a "chapters of the month" ribbon (This week / Last week / June) that also serves as a jump-to?
- If deletion is rare, why is `×` always visible instead of hidden behind a long-press or swipe?
- What would a "quiet log" feel like if days became gentle horizon lines echoing the masthead's roost line?

## Assessment B evidence

- Deterministic detector — `node .github/skills/impeccable/scripts/detect.mjs --json app/transactions/page.tsx`: **0 findings** (exit 0).
- False positives: none.
- Browser visualization: skipped — no browser MCP tool exposed in this session.
