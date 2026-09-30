---
name: Perch
description: A quiet place for your money to rest.
colors:
  # Light mode ("stone paper"). Dark values follow with a -dark suffix.
  bg: "#e6e4de"
  surface: "#ede9e0"
  surface-2: "#f0ede4"
  border: "rgba(29,29,27,0.18)"
  border-strong: "rgba(29,29,27,0.46)"
  fg: "#1d1d1b"
  fg-muted: "#55524a"
  fg-subtle: "#7c786e"
  accent: "#4d6d63"
  accent-hover: "#3a5348"
  primary-bg: "#1d1d1b"
  primary-fg: "#e6e4de"
  income: "#4a6b3d"
  income-soft: "rgba(74,107,61,0.12)"
  expense: "#a65235"
  expense-soft: "rgba(166,82,53,0.12)"
  invest: "#8f6a2a"
  invest-soft: "rgba(143,106,42,0.12)"
  celadon: "#7a9e93"
  bg-dark: "#16181b"
  surface-dark: "#21252b"
  surface-2-dark: "#2a2f36"
  border-dark: "rgba(255,255,255,0.16)"
  border-strong-dark: "rgba(255,255,255,0.38)"
  fg-dark: "#f0ede2"
  fg-muted-dark: "#c1bcae"
  fg-subtle-dark: "#9a9587"
  accent-dark: "#a3d1c1"
  accent-hover-dark: "#b8dfd0"
  primary-bg-dark: "#a3d1c1"
  primary-fg-dark: "#0f1613"
  income-dark: "#8fd0aa"
  expense-dark: "#eb9aa4"
  invest-dark: "#dbb07f"
typography:
  display:
    fontFamily: "Newsreader, ui-serif, Georgia, serif"
    fontSize: "clamp(2rem, 6.5vw, 2.75rem)"
    fontWeight: 400
    lineHeight: "1.02"
    letterSpacing: "-0.028em"
  headline:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "clamp(1.75rem, 5vw, 2rem)"
    fontWeight: 400
    lineHeight: "1.1"
    letterSpacing: "-0.02em"
  title:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: "1.35"
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.5"
    letterSpacing: "-0.005em"
  label:
    fontFamily: "{typography.body.fontFamily}"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: "1rem"
    letterSpacing: "0.22em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.71875rem"
    fontWeight: 400
    lineHeight: "1rem"
    letterSpacing: "normal"
rounded:
  card: "0px"
  control: "4px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary-bg}"
    textColor: "{colors.primary-fg}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.fg}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.fg-muted}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.expense-soft}"
    textColor: "{colors.expense}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.fg}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "44px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.card}"
    padding: "20px"
  chip:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.fg}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: Perch

## Overview

**Creative North Star: "Alcove": a quiet room lit from one window.**

Perch looks like a well-kept paper ledger in a calm room. Light mode is warm
stone paper with near-black ink; dark mode is a cool night room with warm
cream text. One celadon accent marks focus and the active place. Headings
and figures are set in the Newsreader serif; everything functional (labels,
buttons, inputs, notes) is set in Geist sans. Surfaces are square-cornered
rooms divided by hairline walls, and the most important surface on a page,
the "courtyard", catches a soft skylight gradient from the top-left.

Money colors (income green, expense rust, investment bronze) speak only
when a number needs meaning. Nothing performs importance: no KPI walls, no
gauges, no confetti. The anti-references are the bright-fintech candy
palette and the enterprise metric wall.

**Key characteristics:**
- Light and dark themes. Default follows the system; the choice is saved
  per device and set on `<html data-mode>`.
- Square cards (0px radius), 4px controls, full-round pills only for chips
  and the mobile menu pill.
- Serif for headings and amounts, sans for UI, small uppercase tracked
  labels as the quiet signal.
- One skylight gradient per view, on the courtyard surface.
- Mobile-first PWA rhythm: bottom navigation, safe-area aware, 44px targets.

All tokens live in `app/globals.css`. The `@theme` block registers the
light values with Tailwind (`bg-surface`, `text-fg-muted`, …) and
`[data-mode="dark"]` overrides the same variables.

## Colors

### Accent
- **Celadon** (light `#4d6d63`, dark `#a3d1c1`): focus rings, input focus
  borders, checked checkboxes, the active navigation dot, the PerchMark's
  eye, section-head links. Never a large fill.
- **Primary ink** (`--color-primary-bg` / `--color-primary-fg`): the primary
  button and the mobile menu pill. In light mode it is near-black on paper;
  in dark mode it is celadon with dark text.

### Money voice
- **Income** (light `#4a6b3d`, dark `#8fd0aa`): positive amounts, income
  rows, favorable deltas.
- **Expense** (light `#a65235`, dark `#eb9aa4`): negative amounts, expense
  rows, over-cap budgets, danger buttons.
- **Investment** (light `#8f6a2a`, dark `#dbb07f`): investment rows,
  holdings, warnings about money.

Each has a `-soft` variant (12% light, 16% dark) for chip and danger-button
fills.

### Neutrals
- **Paper / Night** (`bg`): page background.
- **Room** (`surface`): cards and rooms.
- **Inset** (`surface-2`): inputs, secondary buttons, pressed filters.
- **Wall** (`border`) and **Strong wall** (`border-strong`): 1px dividers
  and hover/active borders.
- **Ink** (`fg`), **Muted ink** (`fg-muted`), **Faint ink** (`fg-subtle`).

### Charts
Six chart tokens (`--color-chart-1` … `-6`), each with light and dark
values: celadon, rust, bronze, slate blue, plum, ochre. Use them in that
order and never cycle; fold extra series into "Other".

### Named rules
**The One Accent Rule.** Celadon marks where you are and what has focus.
It does not decorate.

**The Money-Only Color Rule.** Income, expense and investment colors
appear only on money: amounts, transaction kinds, budget status. Status
messages that aren't about money use neutral surfaces and ink.

## Typography

- **Serif:** Newsreader (optical sizing on), loaded with `next/font` as
  `--font-newsreader`.
- **Sans:** Geist, `--font-geist-sans`. Body text is 14px, line-height 1.5.
- **Mono:** Geist Mono, used for `.figure` and day-head totals.

### Hierarchy
- **Route title** (`.route-title`, serif 400, `clamp(2rem, 6.5vw, 2.75rem)`):
  one per page, in the masthead.
- **Headline** (`.heading-xl`, serif 400, up to 2rem): large section titles.
- **Title** (`.heading-lg`, serif 400, 1.25rem): card and modal titles.
- **Courtyard figure** (`.courtyard-fig`, serif, up to 5.5rem, tabular):
  the one big number on a page.
- **Entry title / amount** (`.entry-title`, `.entry-amt`, serif ~1rem):
  ledger rows.
- **Label / kicker** (`.label-sm`, `.kicker`, `.field-label`: sans 500,
  11px, tracking 0.22em, uppercase, muted ink).
- **Lede and hints** (`.lede`, `.field-hint`, `.chart-lede`: serif italic,
  muted).

### Named rules
**The Tabular Rule.** Every amount uses tabular numbers and never wraps.

**The Uppercase-Only-For-Labels Rule.** Uppercase belongs to labels,
kickers, filters and the nameplate. Headings, buttons and body copy stay in
sentence case.

## Layout

- **App container:** `max-w-2xl`, centered, 16px gutters (24px from
  `sm`), bottom padding clears the navigation.
- **Nameplate:** each route opens with the PerchMark and PERCH wordmark,
  tools on the right, then a hairline and the serif route title.
- **Bottom navigation:** fixed, translucent (`bg` at 88% with blur),
  safe-area padded. Desktop shows primary and secondary rows split by a
  hairline; the active cell has a small celadon dot at the top. Mobile
  collapses to one primary-ink pill that opens the full menu.
- **Rooms:** `.rooms` stacks children with hairline walls between them;
  `.rooms-h` does the same horizontally. Prefer rooms over separate cards
  with gaps.
- **Spacing:** 4 / 8 / 12 / 16 / 20 / 24. Card padding 20px, entry rows
  14px × 16px, section heads 28px above.
- **Small screens:** under 640px inputs use 16px text to stop iOS zoom.

### Public pages
The landing page, legal pages and status pages (`components/public/`)
share the app's tokens and components and add a few classes at the end of
`globals.css`:
- `.landing-h1/h2/h3`: larger serif display sizes for marketing sections.
- `.landing-stage` and `.landing-device`: the skylight backdrop and the
  framed sample-data previews.
- `.landing-facts`: a three-up `.rooms-h` that stacks on mobile.
- `.legal`: long-form reading styles (serif headings, muted body, underlined
  links) for the privacy policy and terms.

The public header carries the brand, section links, the ES/EN switch, the
theme toggle and sign-in. Previews on the landing page are built from real
app components with labeled sample data, never screenshots.

## Elevation & Depth

Perch is flat. Hierarchy comes from surface steps (bg → surface →
surface-2) and hairline walls, not shadows.

- **Courtyard** (`.courtyard`, `.masthead-balance`): surface fill plus a
  radial skylight gradient from the top-left (warm white in light mode,
  faint amber in dark). It enters with `masthead-settle` (240ms, fade and
  4px rise).
- **Goal reached** (`.goal-reached`): a faint celadon wash from the top
  right and a 1px celadon inset ring.
- **Modals and the mobile menu** float over a dim backdrop.
- **Landing previews** (`.landing-device`) carry one soft offset shadow
  (`0 24px 48px -32px`) so the sample app reads as a device on the stage.
  App screens don't use it.

### Named rules
**The One Skylight Rule.** One courtyard per view. The skylight marks the
most important number; repeating it makes it wallpaper.

**The No-Halo Rule.** No glow shadows on cards, buttons or containers.
Focus uses outlines or a 2px ring.

## Shapes

- **Cards and rooms:** square (0px).
- **Controls** (buttons, inputs, filters): 4px.
- **Checkboxes:** 3px.
- **Pills:** chips, chip dots, the mobile menu pill and nav dots are fully
  round.
- **Borders** are the edge language: every card and control has a 1px wall.

## Components

### Buttons (`.btn`)
- Heights: `sm` 36px, default 44px, `lg` 48px. Sans 500, slight tracking.
- **Primary:** primary ink fill. **Secondary:** inset fill with a wall
  border that strengthens on hover. **Ghost:** no fill, muted ink.
  **Danger:** expense-soft fill that turns solid expense on hover.
- Focus: 2px celadon outline, 2px offset. Disabled: 50% opacity.

### Inputs (`.input`, `.select`, `.textarea`)
- 44px, inset fill, wall border, 4px radius, 15px text.
- Focus: celadon border plus a 2px celadon ring at 30%.
- Label above in `.field-label`; hint below in serif italic; errors in
  expense.

### Entry rows (`.entry`)
The ledger row: a date column (uppercase, muted), a serif title with a sans
note under it, and a serif tabular amount on the right colored by kind.
Day groups open with `.day-head`: a serif date and mono totals over a
strong wall.

### Filters (`.filter`)
Uppercase tracked text buttons. `aria-pressed="true"` gets the inset fill
and a wall border.

### Chips (`.chip`)
Full-round, 11px sans. Neutral by default; `.chip-income`,
`.chip-expense`, `.chip-invest` use the soft money fills.

### Empty states (`.empty`)
A bordered room with a serif italic title and a short serif body, centered.

### Charts (`.chart-card`)
A room with an uppercase chart title, a serif italic lede, then the chart
using the chart tokens in order.

### Skeletons (`.skeleton`)
Inset fill with a slow shimmer that stops under reduced motion.

### PerchMark
The bird-on-a-perch SVG. The body uses `currentColor`; the eye is fixed to
`--color-accent`.

## Motion

Short and rare: 160ms color and border transitions on controls, 240ms
settle on the courtyard, and a 320ms settle on the landing page's sample
ledger rows.
Every animation stops under `prefers-reduced-motion`.

## Do's and Don'ts

### Do
- Use the tokens in `globals.css`; add dark values for anything new under
  `[data-mode="dark"]`.
- Check new screens in both themes and in Spanish, which runs longer.
- Keep amounts tabular and in the serif.
- Group related content into rooms with hairline walls.
- Keep the Perch name, tagline and PerchMark intact.

### Don't
- Don't round cards. Square rooms are the look.
- Don't paint large areas with celadon or a money color.
- Don't use money colors for non-money status (success toasts, error
  banners about the network).
- Don't add more than one skylight per view.
- Don't add glow shadows, gauges, streaks, confetti or notification badges.
- Don't uppercase headings, buttons or body copy.
