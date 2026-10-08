# PR #20 review — qwen3.8-flash round 4 (2026-10-09, ~02:35 local)

Independent headless review of the FULL PR diff (342 lines: 93aa151 + round-3
fixes + spacing polish + the reel touch-gate), same recipe as rounds 1–3.
Verdict: **FIX FIRST** — 1×P1, 1×P2, 6×P3. All actioned in `60fdb63`.

Dispositions:

- **[P1] "never auto-advances on a phone" had become untestable/vacuous** —
  real, with one correction: the reel gate now keys on pointer capability, so
  a mouse-only Chromium at 375px autoplayed, and `toHaveText('01')` passed by
  polling its way into a wrap-around every cycle (verified by probe: samples
  01→02→04→06→01 at 150ms dwell). qwen's claim that CI was therefore red was
  **wrong** — CI ran green on the gate commit; the test could no longer fail
  at all, which is the deeper problem it named. Fix: the test moved to a
  touch-scoped describe (`devices['iPhone SE']` minus its webkit
  `defaultBrowserType`, which cannot sit in a describe under a single
  chromium project) and asserts `matchMedia('(pointer: coarse)') === true` as
  a precondition; the narrow-desktop test asserts the inverse. Scope note:
  the device stays out of the layout tests — `isMobile` emulation
  font-boosts text (reel height 501px vs the 430px budget), so only the gate
  test runs under touch.
- **[P2] a swipe settling on the current slide never stopped autoplay** —
  real: the index-equality filter cannot distinguish "glide landed" from
  "user dragged it back" (elastic overscroll too). Fix: the row stops on
  `pointerdown` and `wheel` — gesture ownership — while the scroll handler
  keeps only glide/noise filtering.
- **[P3] gate comment wrong for wide touch tablets** (coarse + >820px gets a
  still stage + arrows, not the row) — comment rewritten to say that.
- **[P3] deferred start re-checked `calm` but not `touch`** — now re-checks
  both.
- **[P3] re-run inside the 320ms entrance trades the remaining rise for the
  dip** — recorded beside `show()` as a known trade (skipping the dip would
  reintroduce the silent swap the plan exists to kill).
- **[P3] `.sc-out.is-ink` can never match alone** — kept (plan 007's target
  wrote the dual selector) with a why-both half-line.
- **[P3] narrow-pane test could freeze on `is-off`** — now scrolls the reel
  into view and asserts it is not held.
- **[P3] the RM drawer test pinned transitionDuration but not the round-3
  inert toggles** — both directions now asserted (house-style `evaluate` —
  the suite's custom `expect` has no `toBeInert`).

Also noted by the reviewer as CONFIRMED CLEAN: the gate matrix itself (no
configuration loses autoplay it should keep; coarse+wide is *fixed*), the
`n === i` arithmetic for the glide incl. the 06→01 wrap, holds/`is-held`/
`is-off` at narrow widths, scroll-snap vs the glide, inert ordering on all
close paths, RM specificity symmetry, re-ink scoping, CTA band containment.

Gates after fixes: 328 node + 66 e2e, green.
