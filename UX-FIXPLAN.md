# UX-FIXPLAN — Dr. Sumya Pervin Portfolio

**Status: ✅ All P0/P1/P2 fixes applied in commit `8afdcf9`. This document is the historical plan record.**

## Unblock (P0 — do first)

### U01 — Hero heading contrast
- **What:** Hero heading (#FFF6E4) on gradient (gold/amber/orange) has ~1.2:1 contrast
- **Fix:** Add a dark gradient overlay to the hero background or change text color. Smallest change: add `text-shadow: 0 2px 12px rgba(0,0,0,0.35)` to `h1` in hero. Better: apply a translucent dark gradient overlay `::before` on `.hero-inner` so text reads over a darker area. If the heading must stay cream, darken the hero gradient's brighter end (replace `var(--gold)` with `var(--amber)` or `var(--tan)`).
- **Files:** `css/style.css` (`.hero h1`, maybe `.hero-inner`)
- **Verify:** Compute contrast ratio ≥ 4.5:1 for the heading on the new background

### U02 — Section subtitle contrast
- **What:** `.sec-sub` uses `#9A948C` on white (2.86:1)
- **Fix:** Change `color: var(--grey)` to `color: var(--ink)` (#4A443E) on `.sec-sub`
- **Files:** `css/style.css` line 124
- **Verify:** Recompute ratio — #4A443E on white ≈ 9.2:1

## Repair (P1)

### U03/U06/U07 — Booking form reliability
- **Problems:** Double submit creates duplicates; success message lost when modal closes; form data lost on modal close mid-fill
- **Fix (double submit):** Disable submit button on first click with `this.disabled = true` and re-enable on error. Add a one-time guard: `if (submitting) return; submitting = true;`
- **Fix (form persistence):** Save form state to `sessionStorage` on each `input` event; restore on modal open. Clear on successful submit.
- **Fix (success persistence):** After submit, store `lastBookingReference` in `sessionStorage`. On modal open, if reference exists, show link to resend instead of empty form.
- **Files:** `js/main.js` lines 503–560
- **Verify:** Rapid-tap submit 5x — only 1 appointment created. Close and reopen modal — form is preserved. Refresh page after booking — reference persists in session.

### U04 — Confirm-before-send gap
- **What:** "Appointment Request Received" appears before anything reaches the clinic
- **Fix:** Change the success heading to "Appointment Details Saved — Send to Doctor" and make the WhatsApp link the primary (not secondary) action. Reword: "Your appointment request has been saved in your browser. To ensure Dr. Pervin receives it, please send via WhatsApp or Telegram below."
- **Files:** `js/main.js` lines 542–556
- **Verify:** Text reads accurately — user understands they must take a second action

### U05 — No privacy statement
- **What:** Patients submit health info with no statement about data handling
- **Fix:** Add a brief privacy note above the submit button: "Your information is stored only in your browser and shared with Dr. Pervin via WhatsApp/Telegram when you click send. No data is stored on any server."
- **Files:** `index.html` (booking modal, before line 496)
- **Verify:** Note is visible without scrolling on 360px viewport

### U08 — Service cards keyboard accessibility
- **What:** Service cards are `<article>` elements with a delegated click handler — keyboard users tab past them silently
- **Fix:** Either (a) add `tabindex="0" role="button"` and a keyboard listener (`Enter`/`Space` triggers click) on each `.svc`, or (b) change the click target to the existing `<h4>` or arrow button which could be wrapped in a `<button>`.
- **Fix (simplest):** Add `tabindex="0" role="button" aria-label="View details for {service}"` to each `.svc` and handle keyboard events in the grid click handler.
- **Files:** `js/main.js` lines 256–287, `index.html` (add attributes to `.svc` elements)
- **Verify:** Tab through services, press Enter — modal opens

### U09 — Before/after slider keyboard
- **What:** Slider is mouse/touch only
- **Fix:** Listen for `ArrowLeft`/`ArrowRight` on the `.ba-container` element when focused. Add `tabindex="0"` to the container. Move slider 10% per keypress.
- **Files:** `js/main.js` lines 344–370, add keyboard handler
- **Verify:** Focus slider, press left/right arrows — after image width changes

### U10 — Google Fonts rendering
- **What:** No `font-display` — invisible text on slow connections
- **Fix:** Add `&display=swap` to the Google Fonts URL in `index.html`
- **Files:** `index.html` line 10
- **Verify:** On throttled connection, text appears in fallback font immediately and swaps when Outfit loads

### U11/U12/U13/U14 — Generic images used everywhere
- **What:** Same 3 images (hero_portrait, clinic, treatment) reused in 16+ places including certificates, testimonials, before/after, and gallery
- **Fix:** Requires real assets from the owner. No code change can fix this — flag as requiring owner input. For immediate improvement: at minimum use different crops/angles of each image so repeated use is less obvious.
- **Note:** Same as P3 block from the security/code audit (F14). Requires owner decision.

## Systematize (P2 — batch and do in any order)

### U15 — Autocomplete on form fields
- **Files:** `index.html` lines 461, 465, 469, 476, 480, 494
- **Fix:** Add `autocomplete="name"` to patient name, `autocomplete="tel"` to phone, `autocomplete="bday"` to date
- **Verify:** On mobile, autocomplete suggestions appear on field focus

### U16 — Landmarks
- **Files:** `index.html`
- **Fix:** Wrap page content between header and footer in `<main id="main">`. Add `aria-label="Services and Treatments"` etc. to sections.
- **Verify:** Screen reader announces "main landmark" when entering content

### U17 — "Get Free Skin Advice" label
- **Files:** `index.html` line 42
- **Fix:** Rename to "View FAQ" or "Read FAQs"
- **Verify:** Label matches destination

### U18 — Medical term definitions
- **Files:** `index.html` (services, quiz)
- **Fix:** Not a code fix — add brief definitions in the service modal or as tooltips. Smallest change: append "(a treatment using...)" parenthetical on first use of each term. Medium change: add a hover/tap info icon next to each term.
- **Verify:** A reader unfamiliar with dermatology understands each service

### U19 — Custom validation
- **Files:** `js/main.js` (booking submit handler)
- **Fix:** Add validation on blur for phone (must contain digits, minimum length), name (not empty), date (not in past)
- **Verify:** Invalid phone shows message "Please enter a valid Bangladeshi mobile number"

### U21 — ↗ arrow affordance
- **Files:** `css/style.css` / `index.html` (services section)
- **Fix:** Replace ↗ with → or ↵, or if keeping ↗, add tooltip describing it opens a detail view
- **Verify:** Arrow doesn't suggest external navigation

## Polish (P3)

### U22 — Font size consolidation
- Reduce the ~22 distinct sizes to a defined type scale (e.g., 11, 12, 13.5, 15, 16, 18, 20, 24, 32, 44, 60)
- Low priority — existing sizes all look intentional

### U23 — Wordmark as home link
- Wrap `.wordmark` in `<a href="#top">` so tapping it scrolls to top (standard expectation)

### U24 — Touch equivalents for hover effects
- Ensure hover-lift on `.cert`, `.gallery-card` doesn't degrade touch experience

## Risk Assessment

| Fix | Risk | Mitigation |
|---|---|---|
| Hero contrast overlay | Visual change to hero appearance | Use `mix-blend-mode` overlay — non-destructive |
| `.sec-sub` color change | Subtle text becomes darker | Verify against adjacent elements |
| Submit button disable | Blocks double booking | Re-enable on error, verify in testing |
| Keyboard handlers | No visual regression risk | Event listeners only |
| Google Fonts `display=swap` | Layout shift on font swap | Acceptable trade-off for readable text |
| Autocomplete attributes | No visible change | Straightforward attribute addition |
| Service card keyboard | Adds `tabindex` and `role` | Test with screen reader |

## Owner Action Required

- **U11–U14 (generic images):** Provide real before/after photos, certificate scans, and patient testimonial photos (with consent). File suggests Dr. Pervin capture these and upload via CMS.
- **U18 (medical definitions):** Review the service descriptions and approve plain-language alternatives.
