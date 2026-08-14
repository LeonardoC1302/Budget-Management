---
name: Perch
description: A quiet place for your money to rest.
colors:
  bg: "#0a0a0b"
  surface: "#111114"
  surface-2: "#17171b"
  border: "#26262c"
  border-strong: "#35353d"
  fg: "#f4f4f5"
  fg-muted: "#a1a1aa"
  fg-subtle: "#71717a"
  accent: "#6366f1"
  accent-hover: "#7c7ff5"
  income: "#10b981"
  income-soft: "rgba(16,185,129,0.094)"
  expense: "#f43f5e"
  expense-soft: "rgba(244,63,94,0.094)"
  invest: "#f59e0b"
  invest-soft: "rgba(245,158,11,0.094)"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: "2.25rem"
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.02em"
  title:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
    letterSpacing: "-0.015em"
  body:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.375rem"
    letterSpacing: "normal"
  label:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
    letterSpacing: "0.02em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.375rem"
    letterSpacing: "normal"
rounded:
  control: "10px"
  card: "14px"
  modal: "16px"
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
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "#ffffff"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.fg}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.fg}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.fg-muted}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.fg}"
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
  input-focus:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.fg}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.card}"
    padding: "20px"
  card-inset:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.fg}"
    rounded: "{rounded.card}"
    padding: "20px"
  chip-income:
    backgroundColor: "{colors.income-soft}"
    textColor: "{colors.income}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
  chip-expense:
    backgroundColor: "{colors.expense-soft}"
    textColor: "{colors.expense}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
  chip-invest:
    backgroundColor: "{colors.invest-soft}"
    textColor: "{colors.invest}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
  chip-neutral:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.fg}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
---

# Design System: Perch

## Overview

**Creative North Star: "The Nightbird's Perch — a moonlit ledger."**

Perch is a dark, quiet room where money can be looked at without being
shouted about. The whole system is built to feel like sitting in a
low-lit study after hours: near-black surfaces, hairline borders, and a
single indigo light that behaves like the moon on the perch — one
authored glow at the top-right of the masthead balance, one dashed
accent stroke ("the roost line") that grows in on mount, and then
stillness. Semantic income / expense / investment tones are the only
colored voices allowed onto the canvas, and they only speak when a
number needs to mean something. Nothing performs importance; the
figures themselves are the point.

Density is calm, not sparse: money surfaces cluster into fielded
cards with generous internal padding, list rows use ample vertical
rhythm, and the primary action lives at the thumb on mobile via the
bottom-anchored capsule. Motion is authored, brief, and always
respectful of `prefers-reduced-motion`. The aesthetic anti-references
are the two forms of dashboard cliché this product exists to reject —
the bright-fintech "confetti + candy palette" and the enterprise-BI
"metric wall". Perch declines both.

**Key Characteristics:**
- Dark-only, near-black canvas with hairline muted borders
- One accent (indigo) used sparingly; three semantic tones (income,
  expense, investment) reserved for money meaning
- Signature "moon on the perch" masthead glow + dashed "roost line"
- Tabular-nums monetary display, always USD-normalized
- Mobile-first PWA rhythm: bottom nav, safe-area aware, tap-friendly

## Colors

The palette is a night palette. Surfaces recede; text and numbers step
forward through contrast, not saturation.

### Primary
- **Perch Indigo** (`#6366f1`): The single accent. Used on the primary
  action button, focus rings, the active bottom-nav pip, the
  PerchMark's eye, the roost-line dashed stroke, and the radial glow
  on the masthead balance. Never used as a large fill on a body
  surface.

### Semantic (money voice)
- **Ledger Green — Income** (`#10b981`): Positive amounts, income
  transactions, delta pills where "up is good", completed goal states.
- **Ledger Rose — Expense** (`#f43f5e`): Negative amounts, expense
  transactions, danger buttons, delta pills where "down is good" and
  the trend went the wrong way.
- **Ledger Amber — Investment** (`#f59e0b`): Investment transactions,
  Holdings surface, portfolio deltas.

Each semantic color also carries an ~9% alpha "soft" variant (e.g.
`rgba(16,185,129,0.094)`) reserved for filled chip / pill backgrounds
so tinted rows stay quiet on the dark canvas.

### Neutral (surfaces & text)
- **Night** (`#0a0a0b`): Page background, the deepest layer.
- **Roost** (`#111114`): Standard card / surface fill.
- **Nest** (`#17171b`): Inset controls (inputs, buttons secondary,
  hovered rows).
- **Hairline** (`#26262c`): Default border.
- **Hairline Strong** (`#35353d`): Focused / active borders, scrollbar
  thumb.
- **Feather White** (`#f4f4f5`): Primary text and numbers.
- **Feather Muted** (`#a1a1aa`): Secondary text, ghost buttons at rest.
- **Feather Subtle** (`#71717a`): Captions, hints, uppercase small
  labels, dashed dividers' surrounding text.

### Named Rules
**The One Voice Rule.** Indigo appears on at most one non-semantic
element per viewport at a time (the primary action, or the active
pip, or one moon glow — not several). Its rarity is what makes it
read as light, not decoration.

**The Money-Only Color Rule.** Ledger Green, Rose, and Amber never
appear on non-monetary UI. They are reserved for numbers, transaction
kinds, and the direct visual signal of a money movement. Do not use
them for status, tags, or emphasis unless the emphasis is about
money.

## Typography

**Display / Body Font:** System sans stack —
`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
**Mono Font:** System mono stack —
`ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`.

**Character:** Neutral, uninflected, honest. The type is deliberately
un-branded so the money itself carries the voice. Weights only go to
600; nothing shouts.

### Hierarchy
- **Display** (600, `1.875rem` / 30px, line-height `2.25rem`,
  letter-spacing `-0.02em`): The masthead Balance figure and the
  largest amount readouts. Always tabular-nums.
- **Headline** (600, `1.75rem` / 28px, line-height `2rem`,
  letter-spacing `-0.02em`): Route mastheads and full-page section
  titles (`.heading-xl`).
- **Title** (600, `1.25rem` / 20px, line-height `1.75rem`,
  letter-spacing `-0.015em`): Modal titles, card titles
  (`.heading-lg`).
- **Body** (400, `0.875rem` / 14px, line-height `1.375rem`): Primary
  reading size on lists and forms.
- **Label** (500, `0.75rem` / 12px, letter-spacing `0.02em`, UPPERCASE,
  color Feather Subtle): Field labels and small captions
  (`.label-sm`). Uppercase is the calm signal, not decoration.
- **Micro** (400, `10px`, color Feather Subtle): Reassurance riders on
  delta pills, "vs last month" captions.

### Named Rules
**The Tabular-Nums Rule.** Every monetary figure uses
`tabular-nums whitespace-nowrap`. Money columns must align on the
decimal without shimmering as digits change.

**The Uppercase-Only-For-Labels Rule.** UPPERCASE is reserved for
`label-sm` captions. Headings, buttons, and body copy stay in normal
case.

## Layout

Perch is a single-column, mobile-first shell that widens gracefully.

- **Container.** Content is capped at `max-w-3xl` (768px) and centered.
  There is no wide desktop dashboard mode; the phone rhythm scales up.
- **Bottom navigation.** On mobile the primary nav collapses to a
  single indigo capsule ("bird at the thumb"). Desktop reveals the
  full 4 + 5 grid split by a vertical hairline. The nav is fixed,
  translucent (`bg-bg/90 backdrop-blur`), and respects
  `env(safe-area-inset-bottom)`.
- **Route masthead.** Every route opens with a header that lays down
  identity (PerchMark, account menu) followed by a dashed hairline
  divider, then the primary balance / summary card.
- **Spacing rhythm.** The living scale is `4 / 8 / 12 / 16 / 20 / 24`.
  Card internal padding defaults to 20px; list rows use 12px vertical
  gutters. Gaps between stacked cards are 16px.
- **Density.** Amounts and labels never touch each other — there is
  always a 4–6px optical gap. Nothing is packed to the edges.
- **Responsive.** Below 640px, inputs pin to 16px font-size to stop
  iOS zoom. Bottom nav switches modes at the `md` breakpoint.

## Elevation & Depth

Perch is **flat with ambient depth**. It does not use classic drop
shadows for hierarchy; hierarchy comes from surface color steps
(Night → Roost → Nest) and hairline borders.

Every `.surface` carries two co-authored effects that together read
as "sitting on the canvas, not above it":

1. **Inset top-highlight** — `inset 0 1px 0 rgba(255,255,255,0.03)` —
   a one-pixel breath of light along the top edge, the way a physical
   surface catches ambient light from above.
2. **Soft downward shadow** — `0 14px 32px -22px rgba(0,0,0,0.8)` — a
   deep, spread, offset-only shadow. No zero-offset halo. The card
   drops a soft footprint below itself, never a glow around itself.

### Shadow Vocabulary
- **Surface ambient** (`inset 0 1px 0 rgba(255,255,255,0.03), 0 14px 32px -22px rgba(0,0,0,0.8)`):
  Default for every card via `.surface`.
- **Goal-reached ring** (`inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(16,185,129,0.28), 0 14px 32px -22px rgba(0,0,0,0.8)`):
  A one-pixel Ledger-Green ring joins the ambient shadow when a saving
  goal is completed. Same silhouette, celebrated.
- **Modal** (Tailwind `shadow-2xl`): Modals lift off the canvas
  because they interrupt the room.
- **Bottom-nav capsule mobile** (`shadow-lg`): The one place elevation
  is visible on a control, so the thumb finds it at a glance.

### Named Rules
**The No-Halo Rule.** No `0 0 X rgba(...)` glow shadows on cards,
buttons, or containers. Depth is authored with offset shadows, not
halos, so the room stays quiet.

**The One-Glow-Per-Surface Rule.** The masthead balance owns the
single radial indigo glow ("moon on the perch"). Do not repeat that
device on other cards; it is a hallmark, not a pattern.

## Shapes

Corners are soft and consistent, not pill-obsessed.

- **Controls** (buttons, inputs, hoverable rows): **10px** radius.
- **Cards** (surfaces, tiles, delta pills, chart containers): **14px**
  radius.
- **Modals** (bottom-sheet on mobile, dialog on desktop): **16px**
  radius, top-corners-only on mobile bottom-sheets, all corners on
  desktop.
- **Round wells** (category chips, close buttons, transaction type
  icons, mobile nav capsule): **fully round** (`999px`).
- **Dashed accents** (`roost-line`, masthead divider): decorative,
  4px dash / 4px gap, indigo or hairline. Always `aria-hidden`.
- **Borders** are the primary edge language. Every card and control
  is described by a 1px hairline in Hairline or Hairline Strong; the
  fill alone never carries the shape.

## Components

Each component leads with its character line, then its rules.

### Buttons
Steady, thumb-sized, and one-color-per-purpose.
- **Shape:** 10px radius on `sm` / `md`; 12px on `lg`.
- **Sizes:** `sm` = 36px h, 12px x-padding, 14px type; `md` = 44px h,
  16px x-padding, 14px type; `lg` = 48px h, 20px x-padding, 16px type.
- **Primary:** Perch Indigo fill, white text. Hover to
  `accent-hover`. Never combined with a border.
- **Secondary:** Nest (`surface-2`) fill, Feather White text, 1px
  Hairline border. Hover strengthens the border.
- **Ghost:** No fill, Feather Muted text. Hover reveals a Nest fill.
- **Danger:** Expense-soft fill, Ledger Rose text. Hover flips to a
  Ledger Rose fill with white text.
- **Focus:** 2px `accent/60` outline ring on all variants.
- **Disabled:** 50% opacity, `cursor-not-allowed`.

### Inputs
Inset, quiet, and never zoom-happy on iOS.
- **Shape:** 10px radius, 44px height, 14px x-padding.
- **Fill:** Nest surface, 1px Hairline border, Feather White text,
  Feather Subtle placeholder.
- **Focus:** Border shifts to Perch Indigo; a 2px `accent/30` ring
  reinforces the focus without a glow.
- **Label** sits above at `label-sm`; **hint** sits below at 12px
  Feather Subtle.
- **Font-size ≥ 16px on ≤640px** to block iOS zoom on focus.

### Chips
Category and status pills tinted from the semantic soft palette.
- **Round wells** (CategoryChip): a bordered circle showing 1–2
  uppercase initials of a category name, in one of five tones
  (neutral / accent / income / expense / invest). Sizes 32 / 44 / 56.
- **Pill chips** (semantic): soft-tone fill + 30% alpha border +
  same-tone text. 999px radius. Small padding (6px × 10px).

### Cards
The primary container. Always `.surface`.
- **Corner:** 14px radius.
- **Background:** Roost (`#111114`).
- **Border:** 1px Hairline.
- **Elevation:** Surface ambient (see Elevation).
- **Padding:** 20px default (`p-5`). May be turned off for chart-heavy
  or list-heavy cards that supply their own padding.

### Delta pills
A `.surface` micro-card carrying:
- an uppercase `label-sm` name,
- a signed arrow + percentage in the semantic tone (Ledger Green if
  the move is favorable, Ledger Rose if unfavorable, Feather Muted
  if flat or unavailable),
- a `10px` "vs last month" caption in Feather Subtle,
- an optional reassurance rider when the movement is unfavorable.

### Masthead balance (signature)
The single most authored surface in the product.
- `.surface` card, 24px padding, one `.label-sm` "Balance", one
  Amount at Display size, one `.roost-line` under it.
- Radial gradient of Perch Indigo at ~10% alpha rising from the
  top-right corner (the moon).
- Enters with `masthead-settle` (220ms, opacity + 4px translateY,
  cubic-bezier(0.2, 0.6, 0.2, 1)).
- Roost line draws in from 0 → 40px width with 220ms delay.
- Both animations no-op under `prefers-reduced-motion`.

### Bottom navigation
- **Fixed** to the viewport bottom, `bg-bg/90 backdrop-blur`, top
  border in Hairline, bottom padding = `env(safe-area-inset-bottom)`.
- **Mobile:** a single Perch Indigo capsule (44px h, 20px x-padding,
  999px radius, `shadow-lg`) showing the active route's icon + label;
  it opens the full menu on tap.
- **Desktop:** two segmented lists (primary 4 + secondary 5) split by
  a vertical hairline. Active cell shows a 2px Perch Indigo pip pinned
  to the top edge and colors the icon + label in Perch Indigo.

### Modal
Bottom-sheet on mobile, centered dialog on desktop.
- Backdrop: `bg-black/60`, closes on click.
- Panel: Roost fill, Hairline border, 16px radius (top-only on
  mobile), Tailwind `shadow-2xl`, `max-h-90vh`, header + scrolling
  body separated by a 1px Hairline divider.
- Close: a 36px round Nest button with the Feather Muted `×` glyph.

### PerchMark (signature)
The bird-on-a-perch svg. Silhouette inherits `currentColor` so it
tracks the host's text color; the eye is fixed at Perch Indigo. This
is the only element in the system that mixes text-color inheritance
with a hard-pinned brand color.

## Do's and Don'ts

### Do:
- **Do** treat Perch Indigo as light. Use it for the primary action,
  focus rings, the active nav pip, the PerchMark's eye, and the
  masthead's radial glow — and mostly nothing else.
- **Do** reserve Ledger Green / Rose / Amber for money meaning. If a
  color is on the screen, a viewer should be able to point at it and
  say "that's about a number".
- **Do** use `tabular-nums whitespace-nowrap` on every currency
  value.
- **Do** describe cards with a 1px Hairline border + the Surface
  ambient shadow. Fill alone is not enough.
- **Do** honor `prefers-reduced-motion`: mask, don't merely shorten,
  the masthead settle and roost draw.
- **Do** keep the Perch identity (name, tagline "A quiet place for
  your money to rest.", PerchMark glyph) intact across surfaces.

### Don't:
- **Don't** introduce halo shadows (`0 0 X rgba(...)`) on cards,
  buttons, or containers. Depth is offset, not glow.
- **Don't** paint large surfaces in Perch Indigo (banners, hero
  fills, backgrounds). It is a spotlight, not a wall.
- **Don't** use semantic money colors for non-monetary status
  (avoid Ledger Green "success" toasts, Ledger Rose "error" banners,
  etc. — use neutral surfaces with Feather Subtle copy instead).
- **Don't** add a light theme without a product-level decision. Perch
  is committed dark; `color-scheme: dark` is set on the root.
- **Don't** stack multiple radial glows on a single viewport. The
  masthead owns the moon.
- **Don't** repeat capital-letter text outside the `label-sm` role.
  Uppercase buttons or uppercase body copy break the calm.
- **Don't** add "dashboard" chrome: KPI walls, big colored gauges,
  confetti, streak fires, notification counters. The product's
  anti-reference is the metric wall.
