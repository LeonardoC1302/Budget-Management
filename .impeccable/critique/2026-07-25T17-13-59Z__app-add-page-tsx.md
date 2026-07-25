---
target: app/add/page.tsx
total_score: 22
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 2
timestamp: 2026-07-25T17-13-59Z
slug: app-add-page-tsx
---
# Critique: /add (`app/add/page.tsx`)

**Method:** dual-agent (Assessment A — design review sub-agent · Assessment B — detector + evidence sub-agent)

## Heuristic scores

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Silent save → router push, no confirmation |
| 2 | Match System / Real World | 3 | Amount label carries account currency |
| 3 | User Control and Freedom | 2 | No save-and-add-another; browser back only |
| 4 | Consistency and Standards | 3 | Card wrapper isn't the Masthead grammar |
| 5 | Error Prevention | 3 | Over-budget warning is precise and Perch-voiced |
| 6 | Recognition Rather Than Recall | 3 | Semantic color tabs by type |
| 7 | Flexibility and Efficiency | 1 | No prefill, no repeat loop, no shortcuts |
| 8 | Aesthetic and Minimalist Design | 3 | Calm vertical stack |
| 9 | Error Recovery | 2 | Submit disabled silently when amount invalid |
| 10 | Help and Documentation | n/a | Pure form |
| **Total** | | **22/36** | Mid-band; the most-used surface in the app has the flattest peak-end |

## Design specificity

The over-budget inline warning ("This would push X over its $Y cap") is genuinely Perch-voiced; everything else — Card + fields + button — could ship in any budgeting tool.

## Cognitive load

Six vertical fields plus three type tabs, all intrinsic; no >4-option control visible. Load is fine — it's the emotional flatness that's the problem.

## Emotional journey

The highest-frequency page in the product has no peak-end payoff — save kicks silently back home with no "logged", no exhale, no reinforcement of the perch metaphor at the moment it would matter most.

## Consistency with redesigned home

Missing Masthead, no roost-line, no ambient glow on the amount tile, no reassurance copy on save. The one place the "settling in" metaphor should be tangible is where it's entirely absent.

## What's Working

- Over-budget warning line is precise, restrained, Perch-voice
- Amount label reflects `accountCurrency` — respects multi-currency without asking
- Type-tab colors carry semantic meaning at a glance

## Priority Issues

1. **[P0] Silent success on the most-used action** — Why: no confirmation breaks peak-end on the primary flow. Fix: brief inline "Logged" + updated balance, or an "Add another" affordance before navigating. Command: `/impeccable delight`
2. **[P1] No Masthead / brand anchor** — Why: every add is a chance to reinforce the metaphor and instead the page floats. Fix: reuse Masthead with a running-total tile that reacts as you type. Command: `/impeccable overdrive`
3. **[P1] Submit disabled silently when amount ≤ 0** — Why: Jordan can't tell why the button won't respond. Fix: live hint under Amount when parsed value is invalid. Command: `/impeccable clarify`
4. **[P2] No power-user repeat loop** — Why: Alex logs six items after a weekend and repeats every field each time. Fix: "Save and add another" that persists Account / Date / Type. Command: `/impeccable optimize`
5. **[P2] `Card` wrapper is generic** — Why: same grammar as any form; misses the roost-line signature. Fix: apply masthead-balance ambient glow to the amount tile. Command: `/impeccable bolder`

## Persona Red Flags

- **Alex (power user):** No "save and add another" — every entry is a full router round trip through Account and Date selection.
- **Jordan (first-timer):** No explanation for the disabled submit; the tri-tab is the only orientation on the page.
- **Sam (private multi-currency owner):** Amount is entered in account currency but the sibling USD conversion is invisible — silently normalized without preview.

## Minor Observations

- `investment` label truncates to "Invest" for tab width — no matching short form elsewhere
- No prefill from last transaction or most-used category
- Date defaults to today with no "yesterday" quick chip

## Provocative Questions

- What if `/add` were a modal from home so the peak-end never leaves the perch?
- Could the amount field visually "settle" on submit — echoing the bird returning to the branch?
- Should the over-budget message be reassurance, not warning, given home's `reassuranceWhenBad` posture?

## Assessment B evidence

- Deterministic detector — `node .github/skills/impeccable/scripts/detect.mjs --json app/add/page.tsx`: **0 findings** (exit 0).
- False positives: none.
- Browser visualization: skipped — no browser MCP tool exposed in this session.
