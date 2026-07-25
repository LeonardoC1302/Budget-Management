---
target: app/recurring/page.tsx
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-07-25T17-13-59Z
slug: app-recurring-page-tsx
---
# Critique: /recurring (`app/recurring/page.tsx`)

**Method:** dual-agent (Assessment A — design review sub-agent · Assessment B — detector + evidence sub-agent)

## Heuristic scores

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | "Next: date" or "Paused" per row is genuinely useful |
| 2 | Match System / Real World | 3 | "Salary, Netflix" placeholder is warm; cadence labels human |
| 3 | User Control and Freedom | 3 | Pause / Resume / Edit / Delete; ConfirmDialog present |
| 4 | Consistency and Standards | 2 | `Active` / `Paused` use `label-sm` — hierarchy inverted vs home |
| 5 | Error Prevention | 3 | ConfirmDialog explicit about past generated transactions |
| 6 | Recognition Rather Than Recall | 3 | Cadence + category + next occurrence in one glance |
| 7 | Flexibility and Efficiency | 2 | No skip-one, no run-now, no bulk pause |
| 8 | Aesthetic and Minimalist Design | 3 | Paused rows dim to `opacity-60` — delicate signal |
| 9 | Error Recovery | 3 | ConfirmDialog + `toggleActive` is reversible pause |
| 10 | Help and Documentation | 2 | Semi-monthly hint in form is useful |
| **Total** | | **27/40** | Upper-mid; strong status pattern undermined by hierarchy inversion and ASCII glyphs |

## Design specificity

Semi-monthly frequency with a two-day picker and a "last-of-month if fewer days" fallback hint is very Perch — no other budgeting tool goes this deep for a private user.

## Cognitive load

Row clusters three icon buttons on the right — small but crowded. `RecurringForm` shows 9+ fields when semi-monthly is picked, the most cognitively expensive form in the app; day-A / day-B are number inputs where chip selection would be quieter.

## Emotional journey

Pause/resume with `opacity-60` is quietly satisfying. Empty state is transactional. No "you've automated $X of your monthly life" summary that would give Sam a sense of steady state.

## Consistency with redesigned home

Missing Masthead, no `EmptyState` atom, ASCII glyphs `⏸ ▶ ✎ × ↻` everywhere the nav uses stroke icons — this route has the most icon drift of the seven.

## What's Working

- `nextOccurrenceAfter` line on every active row is the most useful status detail in the product
- Active/Paused split with `opacity-60` on paused is a delicate calm signal
- ConfirmDialog copy explicitly protects past-generated transactions

## Priority Issues

1. **[P1] `Active` / `Paused` headings use `label-sm`** — Why: they read as caption weight, inverting hierarchy vs home's `heading-lg` sections. Fix: promote to `heading-lg` with a soft counter ("Active · 4"). Command: `/impeccable typeset`
2. **[P1] ASCII icon glyphs drift from stroke nav icons** — Why: identity drift + accessibility (renders vary by font). Fix: adopt the nav icon family or a matching action set. Command: `/impeccable polish`
3. **[P2] No "automated monthly volume" summary** — Why: Sam wants to feel how much of the month is already accounted for. Fix: small tile totaling active recurring by type per month. Command: `/impeccable shape`
4. **[P2] Empty state is inline stub** — Why: same drift as every other deep route. Fix: `EmptyState` with "Add a recurring rule" CTA. Command: `/impeccable distill`
5. **[P2] Semi-monthly day inputs are number fields with post-submit errors** — Why: harder than chip selection; validation only fires after submit. Fix: two day-of-month `Select`s or a chip grid with disabled equal-day. Command: `/impeccable clarify`

## Persona Red Flags

- **Alex (power user):** No "skip next occurrence" and no "run now" — a one-off skip requires pause/resume choreography around the date.
- **Jordan (first-timer):** The `↻` glyph on every row is unexplained; three action icons crowd one tap-target zone on the right.
- **Sam (private multi-currency owner):** Amount is per-account currency, but no per-currency subtotal; a EUR salary + USD subscription visually sum to nothing.

## Minor Observations

- `pendingDeleteName` gracefully falls back through description → category → "this recurring"
- `nextLabel` says "No upcoming occurrences" for a rare active-but-past-end-date state
- Pause `⏸` and Resume `▶` share one button with a dynamic aria-label — correct pattern

## Provocative Questions

- Could each rule show a "next 4 occurrences" horizon line so rent, salary, and Netflix lay out ahead like perches on a wire?
- Should paused rules collapse into a drawer rather than a second section?
- What if the entire route were a monthly calendar view, with rules dropping onto their days?

## Assessment B evidence

- Deterministic detector — `node .github/skills/impeccable/scripts/detect.mjs --json app/recurring/page.tsx`: **0 findings** (exit 0).
- False positives: none.
- Browser visualization: skipped — no browser MCP tool exposed in this session.
