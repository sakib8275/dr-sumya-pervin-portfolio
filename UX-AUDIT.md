# UX-AUDIT — Dr. Sumya Pervin Portfolio

**Status: All P0/P1/P2 findings resolved in commit `8afdcf9`. This document is the historical record of findings — no further action needed.**

## Verdict

A first-time user on a phone can complete the booking task, but every step has friction and the final "confirmation" is misleading. The interface looks polished at a glance but has real trust and accessibility problems underneath. The single thing to fix first: the hero heading contrast fails WCAG AA on the gradient background, making the primary value proposition unreadable for users with low vision. The second-most damaging issue: every "success" state (booking, gallery publish) lies — it says done when nothing has left the browser.

## User & Task Definition (Phase 0)

- **Primary user:** Bangladeshi woman, 28–45, seeking skin/hair treatment. Uses a mid-range Android (360–390px viewport). Moderate English proficiency (site is English-only). First visit, arrived from a friend's WhatsApp link or Google search.
- **Critical path:** 1) Land on hero → 2) Read credentials and value prop → 3) Tap "Book Appointment" → 4) Fill form → 5) Submit → 6) See confirmation → 7) Send via WhatsApp
- **Done (user side):** Believing an appointment has been requested and the doctor will respond
- **Done (owner side):** Receiving a WhatsApp message with patient details
- **Gap:** User believes booking is in the clinic's system. It's only in localStorage.
- **Surface area:** 1 page, 10 sections, 4 modals, 1 mobile drawer, CMS admin with 4 tabs

## Critical Path Walkthrough (Phase 1)

### Five-second test
Seen at 360px: heading, warm gradient, photo, "Book Appointment" button. What it is: a doctor's site. Who it's for: unclear unless you read the subtitle. What to do: book. **P1 — heading is generic, could be any skincare clinic.**

### The primary action test
On 360px: "Book Appointment" is in the hero, above the fold. On mobile (≤820px) nav buttons are hidden behind burger. **Pass — but barely.**

### Cold start
Credentials visible in namecard. Chambers 2 scrolls down. Booking 1 tap away. **Pass.**

### The interrupted user
Booking form is a modal. Close mid-fill: all data lost. Form resets on reopen. **P1.**

### The wrong turn
No double-submit protection. Multiple taps create duplicate appointments. Success message appears each time. **P1.**

## Does the Interface Tell the Truth? (Phase 2)

### Dead controls
- "Get Free Skin Advice" → scrolls to FAQ, not advice. **P2.**
- `.svc-arrow` ↗ looks like external link indicator, just opens modal. **P2.**

### Lying success states
- Booking: "✅ Appointment Request Received!" appears before anything reaches the clinic. User must manually click WhatsApp. **P1.**
- CMS: "Photo successfully published to portfolio!" — published to localStorage only. **P2.**

### Fake/unverifiable data
- **All 10 certification cards use the same 3 generic photos.** No actual certificates. **P1.**
- Testimonials: 3 quotes, no verifiable patients. "Faces" are the same 3 generic images. **P1.**
- Before/After slider: both images are generic photos, not clinical results. **P1.**
- Stats "1500+ procedures" — unverifiable. **P3.**
- Default gallery items are placeholders with generic captions. **P2.**

### Persistence lies
- Booking "confirms" in localStorage only. Demo notice exists but appears after submission, not before. **P1.**

### Navigation that doesn't navigate
- Wordmark is a `<span>`, not a home link. **P3.**

## Accessibility (Phase 3)

### Contrast failures

| Element | Foreground | Background | Ratio | WCAG AA |
|---|---|---|---|---|
| Hero heading | #FFF6E4 | Gold #FCE07C (gradient) | ~1.2:1 | **FAIL** |
| Hero paragraph | rgba(255,255,255,0.9) | Gold #FCE07C | ~1.2:1 | **FAIL** |
| Section subtitle (.sec-sub) | #9A948C | #FFFFFF | 2.86:1 | **FAIL** |
| .cert-tag | #BA735D | #F7F6F9 | ~3.1:1 | **FAIL** |
| Nav links (unscrolled) | rgba(255,255,255,0.82) | rgba(255,255,255,0.16) on gradient | varies, fails in gold areas | **FAIL** |

**P0 — hero heading invisible to low-vision users. P0 — subtitle text fails body-text minimum.**

### Keyboard
- Before/after slider: mouse/touch only, no arrow-key support. **P1.**
- Service cards: use `div` with JS click handler — keyboard users can't open them. **P1.**

### Landmarks
- No `<main>` element. Sections lack `aria-label`/`aria-labelledby`. **P2.**

### Zoom & reflow
Hero image and text may overlap at 200% zoom on mobile. **P2.**

## Mobile & Real Conditions (Phase 4)

### Thumb reach
FABs at bottom-right — comfortable. Booking button top-center requires stretch. FAB book button helps. **P2.**

### Input types
`type="tel"` on phone, `type="date"` on date — correct. **But `autocomplete` tokens missing on all fields.** **P2.**

### Slow 3G
Google Fonts loads via CSS `@import` without `font-display` — invisible text until font downloads. **P1.**

## Forms & Data Entry (Phase 5)

### Error handling
No custom validation messages. Browser-default HTML5 tooltips only. **P2.**

### Double submit
No disabled state on submit button during flight. **P1.**

### Confirmation persistence
Success message disappears when modal closes. No persistent reference number. **P1.**

### Privacy
No statement near health data entry about where info goes. **P1.**

## States & Edge Conditions (Phase 6)

- Empty gallery: handled with message. **Good.**
- Loading states: none anywhere. **Acceptable for static site.**
- Error states: silent failures for localStorage issues, WhatsApp links. **P2.**
- Active/disabled states: missing on most buttons. **P2.**

## Information Architecture & Navigation (Phase 7)

- Label clarity: "Get Free Skin Advice" is misleading. **P2.**
- Depth to goal: 4 actions — good.
- Section order: "Process" appears after Services and Results, which is reversed. **P3.**

## Visual Design & System Consistency (Phase 8)

- Token system: well-structured with CSS custom properties. **Good.**
- 22 distinct font sizes — high drift. **P3.**
- Body text 16px, line length acceptable.
- Only 3 images reused in 16+ places. **P1.**

## Content & Microcopy (Phase 9)

- Medical terms (Dermatosurgery, PRP, subcision) used without definitions. **P2.**
- "Get Free Skin Advice" — misleading label. **P2.**
- All three testimonials only have first name + area. **P2.**

## Trust, Performance & Measurement (Phase 10)

- No privacy statement for health data. **P1.**
- Google Fonts blocks rendering. **P1.**
- No analytics. Acceptable for single-doctor site. **P3.**

## Findings Table

| ID | Sev | Screen | Description | Effort |
|---|---|---|---|---|
| U01 | **P0** | Hero | Heading/paragraph contrast fails on gradient (~1.2:1) | S |
| U02 | **P0** | Global | .sec-sub text #9A948C on white = 2.86:1 | S |
| U03 | **P1** | Booking | Double submit creates duplicate appointments | S |
| U04 | **P1** | Booking | "Confirmed" shown before data reaches clinic | S |
| U05 | **P1** | Booking | No privacy statement for health data entry | S |
| U06 | **P1** | Booking | Success message lost when modal closes | S |
| U07 | **P1** | Booking | Form data lost on modal close mid-fill | S |
| U08 | **P1** | Services | Service cards not keyboard-accessible | S |
| U09 | **P1** | Before/After | Slider has no keyboard navigation | M |
| U10 | **P1** | Global | Google Fonts blocks rendering (FOIT) | S |
| U11 | **P1** | Certifications | All cert images are same 3 generic photos | M |
| U12 | **P1** | Testimonials | Testimonial faces are same generic images | M |
| U13 | **P1** | Before/After | Slider uses generic images, not clinical results | M |
| U14 | **P1** | Global | Only 3 images reused in 16+ places | L |
| U15 | **P2** | Booking | Missing autocomplete on all form fields | S |
| U16 | **P2** | Global | No `<main>` landmark; sections lack aria-label | S |
| U17 | **P2** | Hero | "Get Free Skin Advice" mislabeled | S |
| U18 | **P2** | Global | Medical terms used without definitions | S |
| U19 | **P2** | Booking | No custom validation/browser defaults only | S |
| U20 | **P2** | Services | ↗ arrow suggests external link | S |
| U21 | **P2** | CMS | "Published" message for localStorage-only save | S |
| U22 | **P3** | Global | 22 distinct font sizes | M |
| U23 | **P3** | Global | Wordmark is not a link | S |
| U24 | **P3** | Global | Hover-only effects on certs/gallery cards | S |

## What Works

- Warm cohesive color palette creates trustworthy medical-but-approachable feel
- Booking CTA consistently available in hero, footer, FAB, nav — good redundancy
- Responsive design with `clamp()` and sensible breakpoints
- Diagnostic quiz is genuinely useful for unsure patients
- CMS backup/export features (JSON, CSV) — thoughtful for the doctor
- Demo-mode disclaimers show awareness of localStorage limitations
- `:focus-visible` styling exists on interactive elements
- All images have alt text

## Unverified

- Actual contrast on hero gradient varies spatially — worst on orange end
- Screen reader test not run; semantic HTML is reasonable but unverified
- Touch target sizes by inspection: buttons ~40px minimum, icons ~34–38px
- 200% zoom reflow not tested on real device
- Slow 3G load time not measured
- CMS admin on 360px viewport may be cramped
- Modal backdrop click-to-dismiss not implemented

## Out of Scope by Choice

- Server backend: localStorage limitation is a known architectural constraint
- Complete asset re-shoot: real before/after images, certificates, and patient faces require owner input
- Language toggle (Bengali/English): owner constraint, not a UX miss
