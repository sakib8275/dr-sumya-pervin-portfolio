# FIXPLAN.md — Dr. Sumya Pervin Portfolio Remediation

## Stop the Bleeding (P0/P1 — minimal diffs)

| ID | Change | Files | Verification | Risk |
|---|---|---|---|---|
| F01 | Remove PIN backdoors: delete `|| pin === "1234" || pin === "admin"`, only check `cmsConfig.pin` | `js/main.js:587` | Test: enter "admin" → rejected, enter "1234" → rejected, enter saved PIN → accepted | Low |
| F09 | Replace placeholder email `clinic@example.com` with real email or remove mailto link | `index.html:379` | Visual check | Low |
| F08 | Remove legacy file `dermatology-portfolio (1).html` | Delete file | `ls` confirms gone | None |

## Safety Net (tests/logging/CI before structural changes)

| ID | Change | Files | Verification | Risk |
|---|---|---|---|---|
| F14 | Add `.gitignore` (exclude `.env`, `*.log`, `node_modules/`), add README note about static nature | New `.gitignore` | `git status` shows clean ignore | None |
| — | Add browser console warning when localStorage-based "CMS" is accessed: "⚠️ This is a client-side demo. Data is not persisted to a server." | `js/main.js` | Open CMS → warning visible | Low |

## Structural (P1/P2 — sequenced for safety)

| ID | Change | Files | Verification | Risk |
|---|---|---|---|---|
| F02+F03 | Add disclaimer banner to booking form and CMS: "Appointments are stored locally in your browser. For production use, connect a backend." | `index.html` + `js/main.js` | Visual: banner appears | Low |
| F06 | Either add `.nav-sticky-wrapper` div in HTML or remove dead JS query | `index.html` or `js/main.js` | Scroll → nav class toggles | Low |
| F07 | Align chamber data between `index.html` and `context.md` — pick the correct set and update the other | `index.html`, `context.md` | Visual: chamber names match | Low |
| F04 | Sanitize WhatsApp/TG share URLs: remove patient notes from URL, or make the notification a simple "New booking — check the CMS" ping | `js/main.js:528-540` | Generated URL no longer contains note text | Low |

## Hygiene (P3 — batched, mechanical)

| ID | Change | Files | Verification |
|---|---|---|---|
| F10 | Either make before/after use the same image with different filter, or add comment noting they're demo images | `index.html:190-199` | Visual check |
| F11 | Add `alt` text clarifying testimonial face images are decorative, not actual patients | `index.html:300-303` | a11y audit |
| F12 | Replace cert images with actual certificate photos if available; otherwise note they're placeholders | `index.html:207-218` | Visual check |

## Recommend Not Doing

- **Adding a real backend**: This is outside the scope of a code audit — it's a product decision. The audit flags the risk; the owner decides if they want Firebase, Supabase, or a simple API.
- **Encrypting localStorage**: It's fundamentally insecure — JS running in the same origin can always read it. The right fix is "don't store patient data in localStorage" or "clearly label it as a demo."
