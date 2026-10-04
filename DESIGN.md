---
name: Dr. Sumya Pervin — Dermatology
description: Diagnosis-first dermatology, set in Bengal indigo and turmeric on unbleached paper.
colors:
  nil: "#23336B"
  nil-deep: "#1A2756"
  nil-tint: "#E4E8F4"
  on-nil: "#C9D1EA"
  haldi: "#E0A526"
  haldi-ink: "#8A5A00"
  paper: "#F7F3EA"
  paper-2: "#EFE8DA"
  surface: "#FFFDF8"
  ink: "#1C2233"
  ink-2: "#4F5568"
  rule: "#DDD5C6"
  rule-dark: "#3A4677"
  field-line: "#8C8576"
  ok: "#2F6B45"
  err-ink: "#A8322A"
  err-bg: "#FBEAE7"
  warn-ink: "#7A5200"
  warn-bg: "#FBF0D6"
typography:
  display:
    fontFamily: "Outfit, Hind Siliguri, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.375rem, 5vw, 3.875rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Outfit, Hind Siliguri, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Outfit, Hind Siliguri, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  figure:
    fontFamily: "Outfit, Hind Siliguri, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 600
    lineHeight: 1.1
    fontFeature: "\"tnum\" 1"
  body:
    fontFamily: "Outfit, Hind Siliguri, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  body-small:
    fontFamily: "Outfit, Hind Siliguri, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.90625rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Outfit, Hind Siliguri, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.14em"
rounded:
  badge: "7px"
  field: "12px"
  inset: "14px"
  panel: "18px"
  card: "20px"
  tier: "22px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "22px"
  lg: "32px"
  gutter: "clamp(18px, 3.4vw, 56px)"
  section: "clamp(56px, 7vw, 104px)"
  container: "1240px"
components:
  button-primary:
    backgroundColor: "{colors.nil}"
    textColor: "#FFFFFF"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "13px 22px"
  button-primary-hover:
    backgroundColor: "{colors.nil-deep}"
    textColor: "#FFFFFF"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.nil}"
    rounded: "{rounded.pill}"
    padding: "13px 22px"
  button-ghost-hover:
    backgroundColor: "{colors.nil-tint}"
    textColor: "{colors.nil}"
  button-on-indigo:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.nil}"
    rounded: "{rounded.pill}"
    padding: "13px 22px"
  chip:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "22px"
  fee-tier:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tier}"
    padding: "30px"
  fee-tier-signature:
    backgroundColor: "{colors.nil-deep}"
    textColor: "{colors.on-nil}"
    rounded: "{rounded.tier}"
    padding: "30px"
  input:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
  flag-today:
    backgroundColor: "{colors.haldi}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "5px 12px"
  badge-operator:
    backgroundColor: "{colors.nil}"
    textColor: "#FFFFFF"
    rounded: "{rounded.badge}"
    height: "24px"
---

# Design System: Dr. Sumya Pervin — Dermatology

> **Status:** these tokens are what the code ships (`public/css/site.css` `:root`). The Nil & Haldi palette was **approved by Dr. Sumya on 2026-10-04** — she confirmed the rebrand was requested — and supersedes the 2026-10-02 gold identity (PRODUCT.md, Brand Commitments).

## Overview

**Creative North Star: "The Written Plan"**

Every visit to this practice ends with a written plan: diagnosis, treatment, timeline and total cost, signed by the doctor. The site is designed as that document. Pages read like paper the patient can take home: unbleached grounds, ruled columns instead of boxes, figures set large and plain, and a byline on every clinical page. Indigo (*nil*) is the doctor's ink: headings' emphasis, actions, prices, the deep grounds that frame what matters. Turmeric (*haldi*) is the one mark a doctor makes on a plan to say *this, today*. It is used rarely, so it is never ignored.

The palette exists because the subject of the site is skin, most of it brown and warm-leaning. A warm frame (peach, orange, spa beige) shares the skin's hue and muddies it. Indigo is its complement, so the frame recedes and skin reads true. The system rejects the two looks the practice positions against. One is the hospital's clinical teal-and-white. The other is the beauty clinic's gold gradients and glamour.

Density is calm but not sparse. Sections breathe at `clamp(56px, 7vw, 104px)`, information sits in open ruled columns, and depth is mostly tonal. Motion follows the same metaphor: things settle like ink into paper. They decelerate and never bounce. There is one authored moment, the home hero, and everything else only explains a change of state.

**Key Characteristics:**
- Unbleached paper grounds with indigo ink; turmeric as a rare signal.
- Open columns under a heavy 2px ink rule, not boxed cards, for the information patients scan.
- Large tabular figures for every price and hour.
- Pill-shaped actions; softly rounded containers. The hero's dome/arch was retired on 2026-10-04.
- Flat by default; shadows only answer state or mark the one recommended choice.
- No gradient ever sits under text.

## Colors

A two-dye palette on paper: deep Bengal indigo carries structure and action, and turmeric carries the single warm signal.

### Primary
- **Nil Indigo** (`nil`): the doctor's ink. Primary buttons, links (`.tlink`), prices and hours, emphasized words in headlines, the recommended tier's 2px border, operator badges, the site-wide focus ring, checkmarks. White on it is 11.9:1.
- **Deep Nil** (`nil-deep`): the dark ground. Utility bar, footer, the ethical-limits band, the price estimator's output panel, the signature fee tier, the hero nameplate, the mobile sticky bar. Also the hover state of primary buttons.
- **Nil Wash** (`nil-tint`): selection and information washes. Ghost-button hover, result panels (the mole tool's output, the booking confirmation), the package sheet's close-button hover.
- **Indigo Mist** (`on-nil`): secondary text on Deep Nil (9.4:1). Never used on paper.

### Secondary
- **Haldi Turmeric** (`haldi`): the signal. It appears as a fill, a rule or a mark: "Consulting today" flags, savings badges, the BMDC credential pill, text selection, the hero underline under "diagnosis", the journey panel's active step bar, the "no" marks in the limits band, and focus rings on indigo grounds. On paper it is 2:1, so it is **never text on a light ground**. On Deep Nil it may be text (6.5:1): the estimator's checkout total.
- **Turmeric Ink** (`haldi-ink`): turmeric for when it must be text on paper (4.86:1 on the darkest paper). It also fills the nurse-operator badge (white on it 5.9:1).

### Neutral
- **Unbleached Paper** (`paper`): the page ground, header bar and hero ground.
- **Folded Paper** (`paper-2`): sunk bands (page heroes, toned sections), notes, chips, table heads. It is the darkest light ground, so every text token is measured against it.
- **Clean Sheet** (`surface`): cards, fee tiers, menus, the drawer and the package sheet. They sit slightly lighter than the paper they rest on.
- **Indigo-Black Ink** (`ink`): body text and headings (14.3:1 on paper), plus the heavy 2px column rules.
- **Faded Ink** (`ink-2`): secondary text, hints, meta lines, table labels (6.1:1 on Folded Paper).
- **Pencil Rule** (`rule`): hairlines, dashed list dividers and card borders. Decorative only.
- **Night Rule** (`rule-dark`): hairlines on Deep Nil.
- **Field Line** (`field-line`): input borders and the scrollbar thumb (3.3:1 on paper, for WCAG 1.4.11).
- **States:** `ok` for confirmations, `err-ink` on `err-bg` for errors, and `warn-ink` on `warn-bg` for booking notices. All are AA.

### Named Rules
**The One Mark Rule.** Turmeric appears at most once or twice per viewport, and only where it means *this one, today*. If a second turmeric element competes, one of them becomes indigo.

**The Paper Test Rule.** Every text color is measured against Folded Paper (`paper-2`), the darkest light ground, before it ships. `tests/contrast.test.mjs` reads the hexes from `site.css` and enforces this. Turmeric used as text outside an indigo ground fails the build.

**The Complement Rule.** No warm frame around skin. Photography and skin-tone illustration sit on paper or indigo, never on turmeric, peach or a warm gradient.

## Typography

**Display Font:** Outfit (with Hind Siliguri, then the system sans)
**Body Font:** Outfit
**Bangla:** Hind Siliguri, loaded by unicode-range only when Bengali text is present, at line-height 1.75.
**Units:** every font size is in `rem` (px ÷ 16), so text follows the reader's browser font-size setting. The px figures below are the sizes at the default 16px.

**Character:** One geometric sans in a few weights. It is plain enough to read like a clinical document and round enough to stay kind. Hierarchy comes from size and weight, never from a second display face or from italics. Outfit has no italic, so emphasis is Nil Indigo color plus a turmeric underline.

### Hierarchy
- **Display** (700, `clamp(38px, 5vw, 62px)`, 1.04, -0.02em): the home hero headline only. Inner page heroes step down to `clamp(34px, 4.6vw, 54px)` with a measure of 22ch.
- **Headline** (700, `clamp(28px, 3.4vw, 40px)`, 1.12): section heads, measure about 26ch, balanced wrapping. The limits band's statement headline goes larger (`clamp(32px, 4.4vw, 54px)`, 1.05).
- **Title** (700, 19–25px, 1.12): card, column and tier titles.
- **Figure** (600, tabular numerals): prices and hours. 44px on fee tiers, 46px in the package sheet, 34px on price cards, `clamp(26px, 2.6vw, 32px)` for chamber hours. These are the numbers a patient scans for, so they carry display weight in Nil Indigo.
- **Body** (400, 16px, 1.55): prose at 76ch maximum (`.s-prose`), ledes at 17–19px and 62ch.
- **Body small** (400, 14–15px): card copy, meta lines and table cells, mostly in Faded Ink.
- **Label** (700, 11–13px, 0.08–0.16em, uppercase): table heads, menu group heads, sheet section heads, the nameplate role line.

### Named Rules
**The Plain Figure Rule.** Every price, fee and hour uses tabular numerals at Figure weight, with the Taka sign before the number and lakh grouping (৳1,75,000). No adjectives replace a number.

**The No-Fake-Italic Rule.** Emphasis is color plus a drawn underline, never a browser-slanted `<em>`.

## Layout

A single centered container (max 1240px) with a fluid gutter (`clamp(18px, 3.4vw, 56px)`) and fluid section rhythm (`clamp(56px, 7vw, 104px)`). Gaps step through roughly 8 / 14 / 22 / 32px, and grid gaps scale with `clamp(24px, 3.4vw, 48px)`.

- **Ruled columns:** the main structure for scannable information. Chambers, the three "What brings you here?" pillars and the Centre's rooms sit as open columns. Each has a 2px ink top rule and no box, laid out in 3-column grids that become 2 and then 1.
- **Fee tiers:** a three-up row with the recommended tier lifted 10px. On phones they stack, with the recommended tier moved first.
- **Breakpoints:** 1100px (top nav gives way to the drawer), 1080px (four- and three-column grids halve, hero stacks), 820px (phone layout: sticky bottom bar of Call / WhatsApp / Book, price tables become stacked cards, the package view becomes a bottom sheet, the journey panel shortens, shows a numeral per step, and does not auto-advance), 480px (single column, full-width CTAs).
- **Tap targets:** at least 44px everywhere (48px drawer rows). This is a product requirement, not a preference.

## Elevation & Depth

Flat by default. Depth comes from tone first: Folded Paper bands sink, Clean Sheet surfaces rise slightly, and Deep Nil grounds carry the weight. Shadows are rare and always indigo-tinted, never brown or black. They appear for exactly three reasons: the patient touched something (hover lift), something opened over the page (menu, drawer, sheet), or one option is the recommended choice.

### Shadow Vocabulary
- **Hover lift** (`box-shadow: 0 4px 14px rgba(28, 34, 51, .07)`): cards and fee cards under the pointer, together with a 2px rise.
- **Recommended** (`box-shadow: 0 16px 34px -10px rgba(28, 34, 51, .18)`): the recommended fee tier and care plan at rest.
- **Overlay** (`box-shadow: 0 18px 36px -14px rgba(28, 34, 51, .22)`; the sheet uses `-24px 0 48px -20px rgba(28, 34, 51, .35)`): mega menu, drawer and package sheet, over an indigo scrim (`rgba(26, 39, 86, .42)`).
- **Nameplate** (`box-shadow: 0 28px 52px -24px rgba(26, 39, 86, .55)`): the hero's one object.

### Named Rules
**The Earned Shadow Rule.** A surface at rest is flat. If a shadow is not answering a touch, an overlay or the single recommendation, delete it.

## Shapes

Actions are pills (999px): buttons, chips, flags and savings badges. Containers are softly rounded: 20px cards, 22px fee tiers, 18px price cards and tables, 14px insets and notes, 12px fields and status boxes, 7px operator badges. Borders are 1px Pencil Rule hairlines, and dashed hairlines divide list rows inside tiers. Emphasis comes from a 2px border (recommended tier) or a 2px top rule (columns), never a thick side stripe.

The arch silhouette was retired on 2026-10-04 (the owner disliked the dome). The hero panel is a plain `--r-card` rectangle.

## Components

### Buttons
Quiet and certain. A press sinks them into the paper.
- **Shape:** full pill (999px), 13px × 22px padding, 15px / 700.
- **Primary:** Nil Indigo with white text. Hover deepens to Deep Nil. Press scales to 0.98. Every change runs at 160ms on the ease-out curve.
- **Ghost:** 1.5px Nil Indigo border and text on transparent; hover fills with Nil Wash.
- **On indigo grounds:** primary inverts to white with Nil Indigo text. The ghost becomes a white outline with a 10% white hover.
- **Focus:** 2px Nil Indigo outline, offset 3px, following the pill shape. On indigo grounds it is turmeric.

### Chips
- **Style:** Folded Paper fill, Pencil Rule border, pill shape, 14px / 600 ink text.
- **State:** link chips hover to Clean Sheet with a Nil Indigo border and text, at 150ms.

### Cards / Containers
- **Corner Style:** gently rounded (20px; fee tiers 22px).
- **Background:** Clean Sheet on paper.
- **Shadow Strategy:** flat at rest; hover lift as in Elevation.
- **Border:** 1px Pencil Rule, turning Nil Indigo on hover.
- **Internal Padding:** 22px (cards), 30px (tiers).
- **Whole-card targets:** a fee card's own button is stretched over the card, so tapping anywhere opens that visit.

### Fee Tiers
The three consultation depths. The middle one is recommended: 2px Nil Indigo border, a Nil Indigo flag pill on its top edge, the Recommended shadow and a 10px lift. The Signature tier sits on Deep Nil with Indigo Mist secondary text. Each tier pairs a large Figure price with its VAT line, then a dashed-rule list of inclusions with indigo checkmarks.

### Inputs / Fields
- **Style:** white fill, 1px Field Line border, 12px radius, 12px × 14px padding, ink text.
- **Focus:** the border turns ink, with a Nil Indigo focus outline at 1px offset.
- **Error:** the border and a 1px inset turn `err-ink`, with a 14px / 600 message below. Booking notices use the warn pair; result and confirmation panels use Nil Wash.

### Navigation
- **Utility bar:** Deep Nil, 13px Indigo Mist text, underlined links.
- **Main bar:** sticky, Unbleached Paper with a Pencil Rule bottom border, 78px tall (64px on phones). Name in 22px / 700 ink over a letter-spaced uppercase tagline. Links are 14.5px / 600 ink and hover to Nil Indigo.
- **Mega menus:** a Clean Sheet panel with an 18px radius that settles 6px into place over 200ms.
- **Mobile:** at 1100px and below, a right-hand drawer (Clean Sheet, 48px rows with hairline dividers) over an indigo scrim. Below 820px a Deep Nil sticky bar adds Call / WhatsApp / Book.

### The Mark (Signature SP)
The practice's logo: a custom S beside a rounded P, grounded by one curved skin contour. It is concept 01 of `design/clinic-logo/`, defined once in `content/brand.mjs` (`mark(cls, weight)`).
- **Colour:** one colour only, drawn in `currentColor`. Nil Indigo on paper, white or paper on Deep Nil, black when only one ink is available. Turmeric may surround it but never fills it.
- **Weight:** the study's 4-unit stroke is right from about 40px up. Smaller placements pass a heavier weight (header 5, drawer 6, favicon 7.5 on its 64-unit tile) so it never thins below about 1.4px.
- **Lockups:** horizontal (the mark, then two lines of type centred on the P's stem) and stacked (type centred under the mark). The name is outlined Outfit 500, one step lighter than the site header so it weighs the same as the monoline stroke. The descriptor is outlined Outfit 500 in caps tracked 0.14em, like the site's label type. Each comes in three colourways: indigo, reverse (white, for Deep Nil and dark grounds) and black.
- **Clear space:** the height of the P's bowl on every side. Nothing else enters that zone, not even the edge of a card.
- **Minimum sizes:** horizontal lockup 160px / 40mm, stacked lockup 96px / 24mm, the mark alone 40px / 10mm at the drawn weight. Below 40px the mark takes the heavier weights above, down to 24px; the favicon tile goes to 16px. Below the horizontal minimum, set the mark beside live text instead.
- **Placements:** header and drawer beside the name, footer above it, the nameplate's turmeric ring (in place of typed initials), the favicon (paper on a Deep Nil tile), the phone icon, and the share card (flat Deep Nil, with no glow behind the name, by the gradient rule).
- **Raster assets** come from `npm run build:brand` (`scripts/render-brand-assets.mjs`). Rerun it when the mark or the name changes.
- **Print and social applications** (logo files, profile and cover images, the written-plan pad, letterhead, cards and chamber nameboards) come from `npm run build:brand-kit` (`scripts/render-brand-kit.mjs`) into `design/brand-kit/`, which also holds the guidelines page. They are generated, never hand-edited.

### The Journey Panel (signature)
The hero's credential panel, standing in for the portrait the doctor chose not to publish. A Deep Nil `--r-card` rectangle titled "Your first visit" that shows the five published consultation steps one at a time (outlined numeral, title, one line; copy shared with the timeline section via `JOURNEY` in `content/pages/home.mjs`), with step bars, a Pause control, then the role, name and credential pills (BMDC pill in solid turmeric). Without JS or under reduced motion all five steps show as a plain list. It is the page's only indigo object above the fold.

### Package Sheet
The detail view for a visit or plan: a native dialog, as a 540px side sheet on desktop and a bottom sheet (90dvh, 22px top corners) on phones. Clean Sheet, a large Figure price between rules, label-type section heads, and actions pinned to the bottom. Where View Transitions exist, it grows out of the tapped fee card and shrinks back into it (440ms ease-out). Otherwise it slides 36px in over 320ms.

### "Consulting Today" Flag
A turmeric pill with a Deep Nil dot and ink text, shown on the chamber columns whose consulting day is today in Dhaka. That chamber's top rule also turns turmeric. This is the clearest use of the One Mark Rule.

### Motion
- **Curves:** `--ease-out` `cubic-bezier(.16, 1, .3, 1)` for arrivals and `--ease-move` `cubic-bezier(.65, 0, .35, 1)` for movement between states.
- **Durations:** `--t-press` 160ms, `--t-state` 320ms, `--t-focal` 760ms.
- **The hero entrance** is the only authored sequence. The headline settles out of a 10px blur. The journey panel fills with indigo from its base (clip-path, 800ms) and starts stepping through the five consultation steps (clip-path wipe, one pass, then rests; paused by hover, focus or the Pause button; static list under reduced motion). Then the turmeric underline is drawn under "diagnosis".
- Everything else explains state. Under `prefers-reduced-motion`, movement is removed and short plain fades remain.

## Do's and Don'ts

### Do:
- **Do** set every text color from the measured set (ink, ink-2, nil, haldi-ink on paper; white, on-nil, haldi on Deep Nil) and keep `tests/contrast.test.mjs` green.
- **Do** keep turmeric to one or two marks per viewport: today, a saving, a selection, the hero underline.
- **Do** lay out scannable information as open columns under a 2px ink rule before reaching for a boxed card.
- **Do** set prices and hours as tabular Figures in Nil Indigo, with VAT shown beside them.
- **Do** use indigo-tinted shadows only for touch, overlays or the single recommended choice.
- **Do** give every animation a reduced-motion path, keep content visible without JavaScript, and animate only opacity, transform, filter and clip-path.
- **Do** keep `style.css`'s `:root` a verbatim copy of `site.css`'s. The legacy gold names there are aliases for the admin panel only.

### Don't:
- **Don't** put a gradient under text. The hero is flat paper by rule and by test.
- **Don't** use turmeric as text on a light ground (2:1). Use Turmeric Ink.
- **Don't** frame skin or skin-tone imagery in warm color: no peach, orange or turmeric grounds behind it.
- **Don't** drift toward clinical teal-and-white or beauty-clinic gold glamour, the two looks the practice positions against.
- **Don't** use thick colored side stripes on cards, notes or alerts. Use a tinted wash or a 2px border.
- **Don't** add a second display face or fake italics. Outfit carries the whole hierarchy.
- **Don't** add repeated scroll-reveal entrances. The hero is the one authored moment.
- **Don't** bring back the arch or dome silhouette.
