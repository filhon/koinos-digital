---
name: Koinos
description: Plataforma SaaS 360° de gestão para igrejas evangélicas brasileiras
colors:
  petroleum-dusk: "oklch(0.32 0.096 224)"
  petroleum-dusk-bright: "oklch(0.64 0.102 232)"
  petroleum-dusk-foreground: "oklch(0.97 0.006 220)"
  bronze-bell: "oklch(0.62 0.148 58)"
  bronze-bell-warm: "oklch(0.70 0.136 62)"
  bronze-bell-foreground: "oklch(0.97 0.008 70)"
  parchment-warm: "oklch(0.982 0.004 80)"
  surface-card: "oklch(0.99 0.003 75)"
  surface-elevated: "oklch(0.995 0.002 70)"
  slate-ink: "oklch(0.18 0.012 230)"
  slate-body: "oklch(0.42 0.016 220)"
  slate-muted: "oklch(0.52 0.016 220)"
  border-subtle: "oklch(0.88 0.01 220)"
  success: "oklch(0.55 0.118 148)"
  warning: "oklch(0.68 0.152 74)"
  error: "oklch(0.55 0.148 28)"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  DEFAULT: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  6: "24px"
  8: "32px"
  12: "48px"
  16: "64px"
components:
  button-primary:
    backgroundColor: "{colors.petroleum-dusk}"
    textColor: "{colors.petroleum-dusk-foreground}"
    rounded: "{rounded.DEFAULT}"
    padding: "0 12px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.petroleum-dusk}"
    textColor: "{colors.petroleum-dusk-foreground}"
    rounded: "{rounded.DEFAULT}"
    padding: "0 12px"
    height: "36px"
  button-accent:
    backgroundColor: "{colors.bronze-bell}"
    textColor: "{colors.bronze-bell-foreground}"
    rounded: "{rounded.DEFAULT}"
    padding: "0 12px"
    height: "36px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.slate-ink}"
    rounded: "{rounded.DEFAULT}"
    padding: "0 12px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.slate-ink}"
    rounded: "{rounded.DEFAULT}"
    padding: "0 12px"
    height: "36px"
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.slate-ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.slate-ink}"
    rounded: "{rounded.DEFAULT}"
    padding: "8px 12px"
    height: "40px"
  badge-primary:
    backgroundColor: "{colors.petroleum-dusk}"
    textColor: "{colors.petroleum-dusk-foreground}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
    height: "20px"
  badge-outline:
    backgroundColor: "transparent"
    textColor: "{colors.slate-ink}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
    height: "20px"
---

# Design System: Koinos

## 1. Overview

**Creative North Star: "The Parish Register"**

Koinos is built around the metaphor of an official parish register — not a software dashboard, but a dignified institutional record that a congregation trusts completely. The system is structured, legible, and warm: not warm in the decorative sense of gradients and rounded corners, but warm in the sense of a well-lit vestry, cream paper, and ink that doesn't bleed. Every screen should feel as if someone who cared deeply about the institution designed it, because they did.

The typography is the first handshake: Instrument Serif carries headings with quiet authority, the way official documents announce themselves without shouting. DM Sans takes the body — functional, contemporary, unhurried at 1.6 line-height. Together they span the congregation: legible for the 60-year-old pastor, modern enough for the 22-year-old worship coordinator. Color serves structure, not mood. Petroleum Dusk anchors interactive elements and navigation; Bronze Bell marks moments of attention (a CTA, an important status, a call to action) with restrained warmth. The rest of the screen is Parchment Warm — a surface that reads as material, not void.

This system explicitly rejects four failure modes named in the product strategy: static and outdated design reminiscent of Eklésia and its kind; heavy gospel aesthetics (gold, doves, religious iconography); the generic translated American SaaS look (identical rounded cards, blue gradients, vague copy); and anything that makes the non-technical user feel underestimated.

**Key Characteristics:**

- Serif display + sans body pairing with tight negative tracking on headings
- Three-tier tonal surface system (page → card → elevated) with warm temperature
- Petroleum-tinted shadows — never black, never flat
- Bronze Bell used sparingly: the accent earns its place through rarity
- Motion via spring and ease-out only; no bounce, no elastic, no layout animation
- WCAG AA contrast across all surfaces; multigerational legibility is not optional

## 2. Colors: The Petroleum and Bronze Palette

A two-accent system on a warm neutral field. Primary and accent rarely appear together; the contrast between cool authority and warm attention is the palette's whole point.

### Primary

- **Petroleum Dusk** (`oklch(0.32 0.096 224)`): The system's dominant interactive color. Navigation backgrounds, primary buttons, active states, sidebar foreground. Dark, mid-saturation blue-teal that reads as authoritative without aggression. In dark mode, surfaces shift to the brighter sibling `oklch(0.64 0.102 232)` to maintain contrast.

### Secondary

- **Bronze Bell** (`oklch(0.62 0.148 58)`): The accent. Copper-warm amber used for input focus rings, the accent button variant, highlighted states, and moments that need to draw the eye without alarm. In dark mode, it warms to `oklch(0.70 0.136 62)`. Its rarity is the point.

### Neutral

- **Parchment Warm** (`oklch(0.982 0.004 80)`): Page background. The thermal hue (80°) tips the near-white surface toward warmth without being ivory. Not cream, not white — a surface with temperature.
- **Surface Card** (`oklch(0.99 0.003 75)`): Card and container background. Fractionally lighter than Parchment Warm; the difference is felt more than seen, creating the first layer of depth.
- **Surface Elevated** (`oklch(0.995 0.002 70)`): Modal, popover, and tooltip backgrounds. The three surfaces form a tonal staircase: page → card → elevated.
- **Slate Ink** (`oklch(0.18 0.012 230)`): Primary foreground text. A near-black with a faint blue-teal lean that echoes Petroleum Dusk. Never pure black.
- **Slate Body** (`oklch(0.42 0.016 220)`): Secondary body copy, supporting text.
- **Slate Muted** (`oklch(0.52 0.016 220)`): Placeholders, metadata, disabled foreground.
- **Border Subtle** (`oklch(0.88 0.01 220)`): Dividers and card borders. Low opacity at 60% (`border-border/60`) on cards so the surface reads as elevated, not caged.
- **Success** (`oklch(0.55 0.118 148)`): Confirmations, completed states, positive indicators.
- **Warning** (`oklch(0.68 0.152 74)`): Soft caution. Amber-adjacent, warm, not alarming.
- **Error** (`oklch(0.55 0.148 28)`): Validation failures, destructive confirmations. Terracotta, not red.

### Named Rules

**The Bronze Bell Scarcity Rule.** Bronze Bell appears on at most two elements per screen: one interactive focus state and one highlighted action or status. Its warmth is only persuasive when it's rare. If it appears on three elements, rework one.

**The No-Black Rule.** Pure black (`#000`, `oklch(0 0 0)`) is never used. Every dark value carries the blue-teal lean of the primary hue (hue ~220–230). Check shadows, overlays, and icon fills.

## 3. Typography

**Display Font:** Instrument Serif (with Georgia, serif fallback)
**Body Font:** DM Sans (with ui-sans-serif, system-ui, sans-serif fallback)

**Character:** The serif anchors headings with quiet institutional authority; the sans carries everything else with clean functional warmth. The contrast between them is the system's primary typographic move — never use DM Sans at large display sizes, never use Instrument Serif for UI labels.

### Hierarchy

- **Display** (400, 2.25rem, lh 1.2, tracking −0.02em): Page titles and hero headings only. Instrument Serif. Tight tracking pulls letters into a single authoritative voice.
- **Headline** (400, 1.75rem, lh 1.25, tracking −0.015em): Section headings, modal titles. Instrument Serif.
- **Title** (400, 1.375rem, lh 1.3, tracking −0.01em): Card titles, sub-section labels. Instrument Serif. Applied via `font-display` class; card titles use `font-medium` weight (500) to differentiate from standalone titles.
- **Body** (400, 1rem, lh 1.6): All prose content. DM Sans. Maximum line length 65–75ch enforced at the layout level.
- **Label** (500, 0.875rem, lh 1.4): Button labels, form labels, navigation items, badge text. DM Sans medium. The workhorse of the UI.

### Named Rules

**The One-Font-Per-Role Rule.** Instrument Serif is for headings (h1, h2, h3, `.font-display`). DM Sans is for everything else. Never use Instrument Serif at label or body scale; never set a heading in DM Sans. The pairing earns its sophistication through discipline.

**The Negative-Tracking Rule.** Headings always carry negative letter-spacing (−0.01em to −0.02em). At display sizes, default tracking reads as loose and informal. Tight tracking is the editorial signature.

## 4. Elevation

This system uses **ambient layering**: every card rests in a gentle petroleum-tinted shadow at rest. Depth signals hierarchy, not interaction. A card's shadow tells you it belongs to a layer above the page — not that it's hovering or active. Interactive state deepens the shadow; at rest, the shadow is always present.

Shadows are tinted toward Petroleum Dusk (`oklch(0.32 0.096 224)`), never toward black. The tint is subtle — opacity never exceeds 12% — but it is what prevents the interface from feeling like generic Material Design box-shadows. In dark mode, shadows shift to pure-dark overlays (black at 15–20% opacity) because the petroleum tint becomes invisible against dark surfaces.

### Shadow Vocabulary

- **Ambient** (`0 2px 4px oklch(0.32 0.096 224 / 0.06), 0 4px 12px oklch(0.32 0.096 224 / 0.05)`): The card's resting shadow. Two layers for softness: a tight near-shadow for definition, a spread far-shadow for depth.
- **sm** (`0 1px 2px oklch(0.32 0.096 224 / 0.08), 0 1px 3px oklch(0.32 0.096 224 / 0.06)`): Tight utility shadow for small floated elements (tooltips, inline chips).
- **md** (`0 4px 6px oklch(0.32 0.096 224 / 0.08), 0 2px 8px oklch(0.32 0.096 224 / 0.06)`): Dropdown panels, floating action areas.
- **lg** (`0 8px 16px oklch(0.32 0.096 224 / 0.10), 0 4px 24px oklch(0.32 0.096 224 / 0.08)`): Drawers, expanded panels.
- **xl** (`0 16px 32px oklch(0.32 0.096 224 / 0.12), 0 8px 40px oklch(0.32 0.096 224 / 0.08)`): Modals, dialogs. Maximum elevation.

### Named Rules

**The Tinted Shadow Rule.** Shadows are never black. Every shadow value carries the Petroleum Dusk hue. If a shadow uses `rgba(0,0,0,...)` or `#000`, replace it with the petroleum tint. This is a mandatory audit step before shipping any new component.

**The Ambient-Not-Active Rule.** Shadow depth does not increase on hover for informational cards. Reserve shadow escalation for interactive surfaces that lift (buttons with press feedback, draggable items, card-level CTAs). A shadow appearing where it didn't exist is a stronger affordance signal than a deepening shadow.

## 5. Components

Components are warm and forthright: clear affordances, no decoration for its own sake, no ambiguity about what is tappable. The radius scale reads as contemporary without being bubbly — 12px default, 20px for cards and larger containers.

### Buttons

- **Shape:** Gently rounded (12px / `--radius`). Not pill, not square. Consistent across all variants.
- **Primary:** Petroleum Dusk background with light foreground (`oklch(0.97 0.006 220)`). Height 36px (h-9), horizontal padding 12px. `font-medium` 14px. Hover dims via `brightness-90`; active presses to `scale(0.97)` over 150ms ease-out.
- **Accent:** Bronze Bell background (`oklch(0.62 0.148 58)`). Used for the single most important action on a screen (primary CTA, confirm final step). Never use alongside a Primary button at equal visual weight.
- **Outline:** Transparent background, `border-border` stroke (1px `oklch(0.88 0.01 220)`). Hover fills `--muted`. Secondary actions.
- **Ghost:** No border, no background. `hover:bg-muted`. Tertiary actions, toolbar items, navigation icon-buttons.
- **Destructive:** Terracotta tinted background (`--destructive/10`), terracotta text. For irreversible actions; always paired with a confirmation dialog.
- **Focus:** `outline-2 solid oklch(0.52 0.118 228)` at 2px offset. Keyboard navigation is fully supported.

### Badges / Status Chips

- **Style:** Full pill (`9999px`), 20px height, 12px text, `font-medium`.
- **Primary (default):** Petroleum Dusk fill. Used for role labels, active status.
- **Outline:** Border `border-border`, transparent background. Used for neutral metadata tags.
- **Destructive:** Terracotta at 10% fill. Warning or error states inline.
- **Ghost:** Hover-only fill. Navigation chips and filter pills in their unselected state.

### Cards / Containers

- **Corner Style:** Generously rounded (20px / `rounded-xl`). Images clipped to `rounded-t-xl` at the top, `rounded-b-xl` at the bottom.
- **Background:** Surface Card (`oklch(0.99 0.003 75)`), one step above the page.
- **Shadow Strategy:** Ambient shadow always present (see Elevation). Not interactive by default.
- **Border:** `border-border/60` — the petroleum-tinted border at 60% opacity. Present for definition without heaviness.
- **Internal Padding:** 16px vertical (`py-4`), 16px horizontal (`px-4`). Small variant: 12px. Consistent gap between header / content / footer slots: `gap-4`.
- **Footer:** Muted background at 30% (`bg-muted/30`), top border at 60% opacity, matches card padding.

### Inputs / Fields

- **Style:** `border border-input` (1px, `oklch(0.88 0.01 220 / ~80%)`), Surface Card background, 12px radius, 40px height. Reads as a contained field without visual heaviness.
- **Focus:** Border shifts to Bronze Bell (`oklch(0.62 0.148 58)`) + `ring-2 ring-bronze-bell/20`. The warm amber focus ring is the system's signature tactile signal — unmissable, warm, not alarming.
- **Error:** Border shifts to terracotta (`--destructive`) + 2px ring at 20% opacity.
- **Disabled:** 50% opacity, `not-allowed` cursor, muted background at 50%.

### Navigation

- **Sidebar:** `oklch(0.978 0.004 78)` background (fractionally cooler than the page, warmer than a card). Items in groups with uppercase 10px muted labels.
- **Typography:** Label-scale DM Sans (14px, medium). Active items use Petroleum Dusk background at 12% (`sidebar-accent`) with Petroleum Dusk text.
- **Active state:** `bg-sidebar-accent oklch(0.92 0.012 220)` fill, `text-sidebar-accent-foreground oklch(0.28 0.068 224)`. No left border stripe — the filled background alone signals selection.
- **Sidebar width:** Animated via spring transition (stiffness 260, damping 26) on collapse/expand.
- **Mobile:** Bottom navigation bar with the same item structure; sidebar is absent.

### Skeleton / Loading

- **Shimmer:** Gradient sweep across the muted surface (`--muted`), 200% wide, 1.8s infinite ease-in-out. Animated via CSS `background-position`, not `width` — no layout animation.

## 6. Do's and Don'ts

### Do:

- **Do** use Instrument Serif for h1, h2, h3, and `.font-display` elements. It is the primary typographic identity signal.
- **Do** keep Bronze Bell to at most two appearances per screen (one focus ring, one highlighted action or status). Rarity is the point.
- **Do** tint every shadow value toward Petroleum Dusk. The shadow hue is part of the system's coherence.
- **Do** use the three-surface staircase (page → card → elevated) to communicate depth. Surface color IS the elevation signal.
- **Do** use negative letter-spacing on all display and headline text (−0.01em to −0.02em). Tight tracking at large sizes is the editorial signature.
- **Do** support both light and dark modes. The dark palette is not a simple inversion — it is a separately designed set of values with its own surface hierarchy.
- **Do** respect `prefers-reduced-motion`. All Framer Motion variants pass through the `safe()` wrapper that returns empty variants when the media query matches.
- **Do** write every label, button, and heading in Portuguese Brazilian. This system was built for Brazil, not translated to it.

### Don't:

- **Don't** use a `border-left` or `border-right` greater than 1px as a colored accent on cards, list items, or callouts. Rewrite with background tints, full borders, or leading icons.
- **Don't** use `background-clip: text` with a gradient (`-webkit-background-clip: text`). No gradient text, ever.
- **Don't** use glassmorphism (blurred card backgrounds with `backdrop-filter`) as a default surface treatment. The system has explicit surface tokens; use them.
- **Don't** use pure black (`#000`, `oklch(0 0 0)`) in shadows, overlays, or foreground colors. Every dark value carries the petroleum hue lean.
- **Don't** build the hero section as a big metric number, small label, supporting stats, gradient accent. This is the SaaS cliché the system explicitly rejects.
- **Don't** design identical card grids with the same icon + heading + text structure repeated. Cards are for grouped information with internal hierarchy, not for equal-weight item lists.
- **Don't** reach for a modal as the first solution. Exhaust inline disclosure, side sheets, and progressive reveal before opening a dialog.
- **Don't** import gospel aesthetic references: no gold color as a primary or accent, no dove iconography, no heavy religious visual language. The system signals faith through community and trust, not iconography.
- **Don't** reproduce the Eklésia design pattern: static pages, outdated visual language, no motion feedback. The benchmark is modern apps the congregation's youngest volunteers already use daily.
- **Don't** ship the generic translated American SaaS look: identical rounded cards in a grid, flat blue gradient headers, copy that says "Gerencie sua equipe com facilidade." Koinos was built for the Brazilian church context and should look like it.
- **Don't** underestimate the non-technical user. No copy that requires technical vocabulary. No affordance that requires prior SaaS experience. Clarity above cleverness.
