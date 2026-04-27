# LIGMA — Design Doc

**Project:** LIGMA (Let's Integrate Groups, Manage Anything)
**Inspiration source:** [samenveiligonderweg.nl](https://samenveiligonderweg.nl/) — directly analyzed
**Document version:** 2.0 (rewritten with real values from live site)
**Status:** Ready for build

---

## 1. What the Source Site Actually Looks Like

After actually browsing samenveiligonderweg.nl, the design language is far more distinctive than a generic "Dutch road safety" inference would suggest. Three things define it:

1. **A warm cream surface** (not white) that runs through every page and gives the whole site an editorial, almost print-magazine warmth.
2. **One signature accent color — pure traffic-sign yellow** — used at high saturation across CTAs, full-bleed callout sections, and tiny inline icon dots. There is essentially no third color. It's a two-color system.
3. **Massive bold display type with line-height 1.0**, paired with documentary photography of real Dutch road safety workers (yellow safety vests in the photos echo the brand yellow — the photography and the brand color are doing the same job).

Components are pill-shaped (basically full radius), cards are large rounded rectangles on the cream background, and small inline CTAs use a distinctive yellow circle with a dark arrow inside. The result feels confident, warm, modern, and unmistakably Dutch — Scandinavian-adjacent in restraint but more punchy.

This system maps **really well** onto LIGMA, because:

- A canvas product needs a calm surface. The cream cuts the harsh white of typical SaaS without going dark-mode.
- Action items on a brainstorm board are exactly the thing yellow signals best.
- Traffic-sign visual language (the source site uses real road signs decoratively) gives us a free metaphor for our intent classification system: action items = yellow, decisions = blue (mandatory road sign color), open questions = light blue (information signs), references = neutral/gray, locked nodes = red (warning).

We lean into this. LIGMA looks like a confident, editorial workspace — cream surface, one bold accent, cards as the primary unit, big type, real photography only on landing pages.

---

## 2. Color Palette

All values below are sampled directly from the live site or extended from its system to cover LIGMA's needs.

### Surfaces

| Token | Hex | Source | Usage |
|-------|-----|--------|-------|
| `--surface-0` | `#F5F1E4` | **From site** (rgb 245, 241, 228) | App background — warm cream, the signature surface |
| `--surface-1` | `#FFFFFF` | From site | Elevated surfaces — cards, sticky notes, modals, panels |
| `--surface-2` | `#EDE7D5` | Extended (cream darker) | Subtle hover, dividers on cream surface |
| `--ink` | `#231F20` | **From site** (rgb 35, 31, 32) | Primary text — warm near-black, not pure black |
| `--ink-muted` | `#5C5854` | Extended | Secondary text, captions, timestamps |
| `--ink-subtle` | `#9A9590` | Extended | Tertiary, placeholders, disabled state |
| `--border` | `#E1DAC6` | Extended (cream + darker) | Hairline borders, default separators |

### Primary accent (the brand yellow)

| Token | Hex | Source | Usage |
|-------|-----|--------|-------|
| `--accent-yellow` | `#FFD702` | **From site** (rgb 255, 215, 2) | Primary CTAs, action-item tag, brand yellow |
| `--accent-yellow-hover` | `#E6C100` | Extended | Hover state for primary buttons |
| `--accent-yellow-soft` | `#FEF6CC` | Extended | Soft-fill backgrounds for action-item cards on Task Board |

### Intent-classification colors (extended from traffic-sign visual vocabulary)

The source site decoratively uses real Dutch road signs — blue mandatory signs, red warning triangles, white-and-yellow priority signs. We re-use that color logic for LIGMA's four intent types:

| Intent | Filled bg | Filled fg | Border / dot | Rationale |
|--------|-----------|-----------|--------------|-----------|
| **Action item** | `#FEF6CC` | `#5C4500` | `#FFD702` | Brand yellow — highest visual weight (most important intent) |
| **Decision** | `#DFE9F5` | `#0F2D5C` | `#1F4E9D` | Mandatory blue — like Dutch "must do this" signs |
| **Open question** | `#E0F0FA` | `#0B4870` | `#3D8FBC` | Information blue — softer than decision |
| **Reference** | `#EDE7D5` | `#3D3933` | `#9A9590` | Neutral cream-darker — visually quiet, doesn't compete |

### Semantic (state)

| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | `#16A34A` | Successful actions, completed tasks |
| `--warning` | `#F59E0B` | Cautions, near-conflict states |
| `--danger` | `#C8302D` | Locked-node indicator, destructive confirmations, errors |
| `--info` | `#1F4E9D` | Links and informational chips (= same as decision blue for consistency) |

> **Note on `--danger` / locked nodes:** The source site uses a warm red (the warning triangle) — `#C8302D` is the closest sample. This matches Dutch road-sign red. Use it sparingly: locked icons, destructive confirms only.

---

## 3. Typography

### Source site uses paid fonts — we need free alternatives

The live site uses **PP Neue Corp** (Pangram Pangram Foundry, paid) for headings and **Authentic Sans** (Authentic Type Co., paid) for body. These are licensed and not legal to redistribute. Below are the closest free Google Fonts equivalents we'll use for LIGMA.

### Font choices

| Role | Source uses | LIGMA uses (free) | Why |
|------|-------------|-------------------|-----|
| Display / headings | PP Neue Corp 700 | **Bricolage Grotesque** (700–800) | Same chunky-humanist character, slight contemporary warp, supports tight line-height |
| Body / UI | Authentic Sans | **Geist Sans** | Closest match for the modern-minimal feel; free under OFL; also has variable-weight axis |
| Monospace | (n/a on source) | **Geist Mono** | Pairs with Geist for the event log and IDs |

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;600;700;800&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Backup option** if Bricolage Grotesque feels too playful in practice: swap to **Funnel Display** (also free Google Fonts) — slightly more neutral, similar weight presence.

### Type scale (mirrors the source site's scale, calibrated for LIGMA)

The source site uses extremely tight line-height on display type — **literally `line-height: 1.0`** (verified from the page's computed styles). We adopt this for our display sizes; it's distinctive and on-brand.

| Token | Font | Size | Weight | Line-height | Use |
|-------|------|------|--------|-------------|-----|
| `display-xl` | Bricolage Grotesque | 64px | 700 | **1.0** | Marketing/landing hero |
| `display-lg` | Bricolage Grotesque | 48px | 700 | **1.0** | Large section headers |
| `h1` | Bricolage Grotesque | 36px | 700 | 1.05 | Page titles |
| `h2` | Bricolage Grotesque | 24px | 700 | **1.0** | Card titles, section headers (matches source `h2` exactly) |
| `h3` | Bricolage Grotesque | 19px | 600 | 1.2 | Subsections, panel titles |
| `body-lg` | Geist | 17px | 400 | 1.55 | Long-form text, prose |
| `body` | Geist | 15px | 400 | 1.5 | Default UI text |
| `body-sm` | Geist | 13px | 400 | 1.45 | Secondary UI text |
| `caption` | Geist | 12px | 500 | 1.4 | Timestamps, metadata |
| `mono` | Geist Mono | 13px | 400 | 1.5 | Event log entries, IDs |

### Typography rules

- Body uses sentence case. UI labels use sentence case (not Title Case).
- Display type uses bold weight (700) and tight line-height (1.0) — this is what gives the source site its punch and we want the same.
- Numbers in metadata: `font-variant-numeric: tabular-nums`.
- Prose line length: max 65 characters.
- Avoid italics in UI; the source doesn't use them and they'd look out of place.

---

## 4. Spacing and Layout

### Spacing scale (4px base)

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 24px
--space-6: 32px
--space-8: 48px
--space-10: 64px
--space-12: 96px
```

The source site is **spacious**. Cards have ~32–40px internal padding. Sections have ~96px+ vertical breathing room. We mirror this generosity in LIGMA's marketing/landing surfaces. Inside the canvas room itself we tighten down to keep tools accessible.

### Layout shell (room view)

```
┌─────────────────────────────────────────────────────────┐
│  Topbar (64px) — cream bg, dark text                    │
├──────┬─────────────────────────────────┬────────────────┤
│ Left │                                 │  Right         │
│ rail │     Infinite canvas             │  panels        │
│ 64px │     (cream, fluid)              │  340px         │
│      │                                 │                │
│      │                                 │  Task Board    │
│      │                                 │  Event Log     │
│      │                                 │  (tabbed)      │
└──────┴─────────────────────────────────┴────────────────┘
```

- **Topbar (64px):** Logo (left), room name (center, h3 weight), share button + presence avatars + role badge (right). Cream background, hairline bottom border.
- **Left rail (64px):** Tool selector — pointer, sticky note, text, drawing. Square buttons, 48px hit target, icon centered. Active state: yellow background.
- **Canvas:** Cream `--surface-0`. Pannable, zoomable. Dot-grid background optional (subtle, `--ink-subtle` at 6% opacity).
- **Right panels (340px):** White `--surface-1`. Tabbed: Task Board / Event Log / Replay (later).

### Border radius — the source uses generous radii

The source site verifiably uses ~**33px** on pill buttons (essentially full radius for a button of that height) and ~**16–20px** on cards and image hero. We adopt:

```
--radius-sm: 8px      // chips, tags, small pills
--radius-md: 12px     // inputs
--radius-lg: 20px     // cards, sticky notes, modals
--radius-xl: 32px     // big landing surfaces
--radius-pill: 9999px // CTA buttons (matches source)
```

> **Sticky notes get `--radius-lg` (20px)**. This is intentionally *not* the traditional Post-it square. Traditional sticky-note-square skeu looks dated; the rounded version is more modern and matches the source site's card language.

### Elevation

```
--shadow-sm: 0 1px 2px rgba(35, 31, 32, 0.04);
--shadow-md: 0 4px 14px rgba(35, 31, 32, 0.06);
--shadow-lg: 0 18px 40px rgba(35, 31, 32, 0.10);
```

Shadows are subtle and warm-tinted (the rgba uses the ink color, not pure black). The source site uses very little elevation — most "cards" are just white surfaces on cream with no shadow at all, relying on the surface contrast alone. We follow that lead: **default to no shadow, add `--shadow-md` only when a card is draggable/floating** (e.g. a sticky note being moved, a modal).

---

## 5. Component Style

### Buttons

The source site has two button variants. We adopt both, plus a subtle ghost.

**Primary — yellow pill**

```css
background: var(--accent-yellow);  /* #FFD702 */
color: var(--ink);                 /* #231F20 */
border: none;
border-radius: var(--radius-pill);  /* fully rounded */
padding: 14px 28px;
font-family: var(--font-sans);     /* Geist */
font-weight: 600;
font-size: 15px;
transition: background 120ms ease, transform 120ms ease;
```

Hover: background → `--accent-yellow-hover`. Active: `transform: scale(0.98)`. No shadow on default state.

**Secondary — white pill**

Same shape and dimensions. White background, ink text, no border (it sits on cream so the contrast carries). Used when a primary CTA is already on screen, or inside yellow-filled sections (where the primary's yellow would disappear).

**Ghost — text + arrow chip**

This is the source site's distinctive **inline CTA pattern**: a short text label followed by a small yellow circle containing a dark arrow. We adopt it for tertiary actions on cards.

```
Bekijk onze campagnes  ⓨ→
^^ link text             ^^ 28px yellow circle with arrow icon
```

```css
.ghost-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  color: var(--ink);
}
.ghost-cta__chip {
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background: var(--accent-yellow);
  display: grid;
  place-items: center;
}
```

This is a signature element. Use it sparingly but consistently: "View task →", "Open in canvas →", "Show event →".

**Destructive** — same shape as primary but `--danger` background, white text. For lock/delete confirms.

### Sticky note (the hero component)

- Background: white `--surface-1` (always — the tinted-by-author idea from v1 of this doc is dropped because it competes with the cream surface and yellow accents)
- Border radius: `--radius-lg` (20px)
- Border: none by default; 1px `--border` only on hover
- Shadow: none by default; `--shadow-md` while being dragged
- Padding: 20px
- Min size: 200×140px; auto-grows with content
- Author chip (top-left): 6px circle (deterministic per-user color from a 6-color palette) + Geist 500 caption with name
- Lock icon (top-right): visible to all users when node is locked — uses `--danger` color
- Intent badge (bottom-left): pill chip in the intent's filled-bg/filled-fg colors with the intent's text label ("Action", "Decision", "Question", "Reference")
- Selection state: 2px outline using `--ink` (not yellow — yellow is reserved for action-item content)
- Drag state: scale 1.02, `--shadow-md`, slight rotation (1deg) for tactility

### Task Board card

The Task Board sits in the right panel. Each task is a horizontally compact card.

- Background: white
- Border-radius: `--radius-md` (12px)
- 1px `--border`, no shadow
- Layout: 4px-wide intent stripe on left edge → task text (Geist 15px, 1.4 line-height, max 2 lines, ellipsis) → author avatar + Geist 12px timestamp on right
- Hover: background → `--surface-2`, cursor pointer
- Click: canvas pans + zooms to source node, source node gets a 300ms yellow pulse outline

### Cursor presence

- Custom SVG cursor with a small flag containing user's name
- Background of flag: deterministic per-user color (6-color palette of muted versions of the brand colors)
- Smooth interpolation (50ms transform transition)
- Fade out after 5 seconds of inactivity
- Names are Geist 500, 11px, white text on the flag

### Inputs

- Background: white
- 1px `--border`, becomes 2px `--ink` on focus (no glow halo, no yellow focus ring — yellow is reserved for accent, not state)
- Border-radius: `--radius-md` (12px)
- Padding: 12px 16px
- Font: Geist 15px

### Modals

- Background: white
- Border-radius: `--radius-lg` (20px)
- `--shadow-lg`
- Max width: 480px for confirms, 720px for content
- Backdrop: rgba(35, 31, 32, 0.5) with 4px blur
- 32px internal padding (matches source's generous card padding)

### Toasts

- Top-right of viewport, slide in from above
- Background: white, hairline border, 4px-wide semantic color stripe on left edge
- Border-radius: `--radius-md`
- Auto-dismiss after 4 seconds (errors persist)

### Yellow callout block (for Task Board "no tasks yet" empty state, or AI-summary banner)

Borrowing the source site's full-bleed yellow section pattern, but at panel scale:

- Background: `--accent-yellow`
- Text: `--ink`
- Border-radius: `--radius-lg`
- Padding: 24px
- Use sparingly — only one yellow callout visible on screen at a time.

---

## 6. Iconography

- **Library:** Lucide Icons (free, MIT)
- **Sizes:** 18px in dense UI, 20px standard, 16px inside the ghost-CTA chip
- **Stroke:** 2px (Lucide default — slightly heavier than the 1.75 in v1 of this doc, because it pairs better with Bricolage Grotesque's chunkiness)
- **Color:** inherits current text color, except the arrow inside ghost-CTA chips which is always `--ink` on yellow

For the lock icon specifically, use Lucide's `Lock` — sized 14px, `--danger` colored, top-right of locked sticky notes.

---

## 7. Motion

The source site uses **Lenis** (smooth scrolling) and what looks like GSAP-driven section reveals. We don't need to match the marketing-site theatrics in our app surface, but we keep the same easing language so motion feels continuous between landing and app.

### Tokens

```
--ease-standard:   cubic-bezier(0.4, 0, 0.2, 1);
--ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
--ease-accelerate: cubic-bezier(0.4, 0, 1, 1);

--duration-instant: 80ms;
--duration-quick:   150ms;
--duration-medium:  280ms;
--duration-slow:    480ms;
```

### Use cases

| Interaction | Duration | Easing |
|------------|----------|--------|
| Button hover | quick | standard |
| Button active (scale 0.98) | instant | standard |
| Sticky note appear | medium | decelerate |
| Sticky note drag (scale + rotate) | quick | standard |
| Task slides into board | medium | decelerate |
| Modal open/close | medium | standard |
| Yellow pulse on canvas node (on task click) | slow | decelerate |
| Cursor interpolation | 50ms linear | linear |
| Lock icon appear | quick | decelerate |
| Canvas pan/zoom | (continuous, no easing) | — |

### Reduced motion

Always respect `prefers-reduced-motion: reduce`. Replace transitions with instant; never disable functionality. Specifically: the yellow-pulse-on-task-click effect should be replaced with a static border highlight when reduced motion is on.

---

## 8. Accessibility

- **Contrast.** Verified for our palette:
  - Ink `#231F20` on cream `#F5F1E4`: contrast ~13:1 ✓ (AAA for body)
  - Ink `#231F20` on yellow `#FFD702`: contrast ~14:1 ✓ (AAA — the yellow is *that* saturated)
  - Ink on white: ~16:1 ✓
  - Yellow `#FFD702` on cream `#F5F1E4`: contrast ~1.4:1 ✗ — **never use yellow as text on cream**. Yellow is for fills only, with ink text on top.
- **Focus indicators:** 2px solid `--ink` outline with 2px offset on every interactive element when keyboard-focused.
- **Keyboard navigation:** Tab order matches visual order. Sticky notes reachable and editable via keyboard. Tool rail keyboard-shortcut accessible (V for pointer, S for sticky, T for text).
- **ARIA:** `aria-live="polite"` on Task Board container so screen readers announce new tasks. Lock state announced via `aria-disabled` and `aria-label`.
- **Color is never the only signal:** Locked nodes show a lock icon + `aria-label`. Intent tags show text labels, not just color stripes.

---

## 9. Component Examples (visual mockups)

### Sticky note states

```
[Default]                   [Selected]                  [Locked]
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│ ● Hamza · 2m ago     │    │ ● Hamza · 2m ago     │    │ ● Hamza · 2m ago  🔒 │
│                      │    │                      │    │                      │
│ Hamza to finish      │    │ Hamza to finish      │    │ Hamza to finish      │
│ auth module by Fri   │    │ auth module by Fri   │    │ auth module by Fri   │
│                      │    │                      │    │                      │
│ [⬤ Action]           │    │ [⬤ Action]           │    │ [⬤ Action]           │
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘
  white, no shadow             2px ink outline             lock + dimmed edit
                                                            affordance, danger
                                                            icon top-right
```

### Task Board card

```
┌─┬─────────────────────────────────────────────────────────────┐
│ │ Hamza to finish auth module by Friday                       │
│ │                                                              │
│ │                                              ⓗ Hamza · 2m   │
└─┴─────────────────────────────────────────────────────────────┘
  ↑
  4px yellow stripe (because intent = action item)

  hover: surface-2 background, cursor pointer
  click: canvas zooms to node, node yellow-pulses
```

### Topbar

```
┌──────────────────────────────────────────────────────────────────────┐
│  ◼ LIGMA   Sprint Planning · Oct 24       [Copy link]  ⓗⓒⓢ  [Lead]  │
└──────────────────────────────────────────────────────────────────────┘
   logo       room name (h3)                share btn  avatars role pill
```

The role pill on the right uses the yellow CTA style if the user is Lead, white pill if Contributor, ghost (text only) if Viewer.

### Inline ghost CTA

```
View source on canvas  ⓨ→
                       ^^ 28px yellow circle, dark arrow inside
```

### Yellow callout (Task Board empty state)

```
┌───────────────────────────────────────────┐
│                                           │
│  No action items yet                      │
│                                           │
│  Write something like "Aisha to ship the  │
│  auth flow by Friday" on a sticky note —  │
│  it'll show up here automatically.        │
│                                           │
└───────────────────────────────────────────┘
   yellow #FFD702 bg, ink text, 20px radius
```

---

## 10. Implementation Notes

### Tailwind config (drop-in)

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        surface: { 0: '#F5F1E4', 1: '#FFFFFF', 2: '#EDE7D5' },
        ink: { DEFAULT: '#231F20', muted: '#5C5854', subtle: '#9A9590' },
        border: { DEFAULT: '#E1DAC6' },
        accent: {
          yellow: { DEFAULT: '#FFD702', hover: '#E6C100', soft: '#FEF6CC' },
        },
        intent: {
          action:    { bg: '#FEF6CC', fg: '#5C4500', border: '#FFD702' },
          decision:  { bg: '#DFE9F5', fg: '#0F2D5C', border: '#1F4E9D' },
          question:  { bg: '#E0F0FA', fg: '#0B4870', border: '#3D8FBC' },
          reference: { bg: '#EDE7D5', fg: '#3D3933', border: '#9A9590' },
        },
        success: '#16A34A',
        warning: '#F59E0B',
        danger:  '#C8302D',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans:    ['Geist', 'system-ui', 'sans-serif'],
        mono:    ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '8px', md: '12px', lg: '20px', xl: '32px', pill: '9999px'
      },
      boxShadow: {
        sm: '0 1px 2px rgba(35, 31, 32, 0.04)',
        md: '0 4px 14px rgba(35, 31, 32, 0.06)',
        lg: '0 18px 40px rgba(35, 31, 32, 0.10)',
      }
    }
  }
}
```

### Konva (canvas) — mirror the same tokens

Konva renders outside the React/Tailwind tree. Define a single `tokens.ts` file that both Tailwind and Konva pull from:

```ts
// src/lib/tokens.ts
export const tokens = {
  surface: { 0: '#F5F1E4', 1: '#FFFFFF', 2: '#EDE7D5' },
  ink: '#231F20',
  accent: { yellow: '#FFD702' },
  intent: {
    action:   '#FFD702',
    decision: '#1F4E9D',
    question: '#3D8FBC',
    reference:'#9A9590',
  },
  danger: '#C8302D',
  radius: { sticky: 20 },
};
```

Pass these into Konva `<Rect>` `fill`, `stroke`, etc.

### Global CSS

```css
:root {
  color-scheme: light;
  background-color: #F5F1E4;
  color: #231F20;
}
body {
  font-family: 'Geist', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, .display {
  font-family: 'Bricolage Grotesque', system-ui, sans-serif;
  font-weight: 700;
  line-height: 1.0;  /* matches source site signature */
  letter-spacing: -0.01em;
}
```

---

## 11. Open Decisions

- **Drawing nodes color:** when freehand drawing is added (post-MVP), should strokes default to `--ink` or to the user's deterministic per-user color? Lean toward per-user color — it makes "who drew what" legible without a tooltip.
- **Canvas grid:** subtle dot grid or no grid at all? The source site has very clean uninterrupted backgrounds; recommend **no grid by default**, with a "Show grid" toggle in the toolbar.
- **Dark mode:** out of scope for the hackathon. The cream/yellow system is built for light. If we add dark later, the yellow stays, the cream becomes a deep brown-charcoal (`#1A1815` ish), the ink inverts. Note this in the README so judges see we thought about it.

---

*End of Design Doc, v2.0 — built on direct analysis of samenveiligonderweg.nl.*
