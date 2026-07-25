---
target: app/goals/page.tsx
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-07-25T17-13-59Z
slug: app-goals-page-tsx
---
# Critique: /goals (`app/goals/page.tsx`)

**Method:** dual-agent (Assessment A — design review sub-agent · Assessment B — detector + evidence sub-agent)

## Heuristic scores

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Every card narrates its future with `EstimateLine` |
| 2 | Match System / Real World | 3 | "Saving goals", "Contribute" — plain |
| 3 | User Control and Freedom | 3 | Edit / Contribute / ConfirmDialog on delete |
| 4 | Consistency and Standards | 3 | `GoalCard` matches home preview |
| 5 | Error Prevention | 3 | ConfirmDialog explicit about "can't be undone" |
| 6 | Recognition Rather Than Recall | 3 | Name + saved-of-target + % + remaining |
| 7 | Flexibility and Efficiency | 2 | No reorder, no archive, no priority |
| 8 | Aesthetic and Minimalist Design | 3 | Card layout breathes |
| 9 | Error Recovery | 3 | ConfirmDialog + reversible contributions |
| 10 | Help and Documentation | 3 | "Add a few weeks of transactions" is in-context help |
| **Total** | | **29/40** | Best-scoring deep route; `EstimateLine` is the app's cleverest UX pattern |

## Design specificity

`EstimateLine`'s four narrated states (reached / no-data / negative / on-pace) are deeply Perch-voice — a pattern worth extending across the whole app.

## Cognitive load

Low; three buttons per card at most. Buttons wrap gracefully. No >4-option control.

## Emotional journey

"Goal reached — nice work" is a rare peak moment. But "You're spending more than you earn right now, so this goal isn't on track" is blunt for a "quiet place" and conflicts with the home's `reassuranceWhenBad` posture.

## Consistency with redesigned home

`GoalCard` matches. Missing: Masthead, `EmptyState` atom, aggregate summary tile at top, no roost-line signature on completed cards.

## What's Working

- `EstimateLine` narrates four distinct futures in one sentence each — the app's cleverest UX pattern
- Contribution modal + ConfirmDialog cleanly separate reversible from irreversible actions
- `GoalCard` respects `goal.currency` at read-time

## Priority Issues

1. **[P1] Negative-rate line is dignity-breaking** — Why: "You're spending more than you earn right now" reads like a verdict on a page called Saving goals. Fix: reframe as "This month you're spending more than you earn; the estimate will resume as soon as that flips." Command: `/impeccable quieter`
2. **[P1] No aggregate summary tile** — Why: page opens with a card and nothing telling Sam "you're saving $X/mo across all goals". Fix: add totals tile (total saved, total target, months-to-all-clear at current rate). Command: `/impeccable shape`
3. **[P2] Empty state is inline stub** — Why: same drift as other routes. Fix: use `EmptyState` with description + CTA. Command: `/impeccable distill`
4. **[P2] Goal currency locked to USD in `GoalForm`** — Why: Sam's Japan trip is naturally a ¥ goal. Fix: expose a currency picker (`GoalCard` already reads `goal.currency`). Command: `/impeccable adapt`
5. **[P3] Reached goals aren't visually celebrated** — Why: "Complete" is the only signal; misses a peak. Fix: on `progress.reached`, add a subtle glow or a "settled" state to the card. Command: `/impeccable delight`

## Persona Red Flags

- **Alex (power user):** No reordering, no priority, no completed-goals archive — all goals sit in one flat list forever.
- **Jordan (first-timer):** Nothing distinguishes a "contribution" from a regular transaction; the mental model isn't set up anywhere on the page.
- **Sam (private multi-currency owner):** Every goal is USD; a ¥-denominated trip requires manual mental math.

## Minor Observations

- `initialAmount` default "0" is fine but the "why" is buried in a small hint
- `note` is captured on contributions but never surfaced back on the card
- No mini history graph of contributions over time

## Provocative Questions

- Could each goal have its own tiny roost-line that fills as contributions arrive?
- What if goals auto-sorted by "most reachable next" to nudge focus?
- Should the negative case redirect to a Budgets nudge instead of a verdict?

## Assessment B evidence

- Deterministic detector — `node .github/skills/impeccable/scripts/detect.mjs --json app/goals/page.tsx`: **0 findings** (exit 0).
- False positives: none.
- Browser visualization: skipped — no browser MCP tool exposed in this session.
