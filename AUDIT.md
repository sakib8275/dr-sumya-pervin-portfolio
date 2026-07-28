# AUDIT.md — Dr. Sumya Pervin Portfolio Website

## Executive Summary

This is a static single-page portfolio site for a dermatologist, built with vanilla HTML/CSS/JS. The visual design is polished and the layout is well-structured. However, the site **cannot be trusted with real patient data in its current state**. The "Doctor CMS Admin Panel" stores patient PII (names, phone numbers, medical notes) unencrypted in the browser's localStorage — this data is accessible to anyone with physical access to the device, any browser extension, or any XSS vulnerability. The CMS is protected by a hardcoded PIN `1234` with a backdoor (`"admin"` also works). The booking form has no server backend; appointments exist only in the browser they were created on and vanish on cache clear. The most urgent fix is removing the patient-data illusion and either adding a real backend or making it clear the data is local-only.

## System Reality Report

- **What it does**: An informational portfolio for Dr. Sumya Pervin, MD — displays credentials, chamber locations, services, FAQ, a before/after slider, testimonials, and a photo gallery. Includes an interactive skincare quiz and a booking modal with a "Doctor CMS" admin panel.
- **Request flow**: All static — no server. A user loads `index.html`, navigates sections via anchor links, clicks modals (booking, service details, CMS admin). The booking form stores submissions to `localStorage`. The CMS admin panel reads/writes gallery items and appointments from `localStorage`. WhatsApp/Telegram notification links are generated client-side.
- **Data model**: Two localStorage keys: `dr_sumya_appointments` (array of patient bookings with name, phone, chamber, date, service, notes, status) and `dr_sumya_cms_gallery` (array of gallery items with title, category, caption, image as base64 string). A config object `dr_sumya_cms_config` stores WhatsApp number, Telegram username, and admin PIN.
- **Trust boundaries**: No server, no network requests. All data is client-side. The boundary is between the user's browser and localStorage — no authentication, no encryption.
- **Audit Round 2 (UI/UX)**: Completed after Round 1 — see `UX-AUDIT.md` and `UX-FIXPLAN.md`. All P0/P1/P2 findings from both rounds have been remediated.
- **Hot core**: `js/main.js` (1021 lines, all logic), `index.html` (652 lines, all markup), `css/style.css` (1581 lines, all styles).

## Findings Table

| ID | Severity | Area | File:Line | Description | Fix Effort |
|---|---|---|---|---|---|
| F01 | P1 | Security | `js/main.js:587` | CMS PIN has backdoor — "admin" and "1234" both accepted | S |
| F02 | P1 | Security | `js/main.js:31-44` | Patient PII (name, phone, medical notes) stored unencrypted in localStorage | M |
| F03 | P1 | Data | `js/main.js:48-61` | Appointments exist only in localStorage — no server backup, lost on cache clear | L |
| F04 | P2 | Security | `js/main.js:528-540` | Patient data leaked via URL params in WhatsApp/Telegram share links | S |
| F05 | P2 | Security | `js/main.js:662` | Photo upload stores images as base64 in localStorage — size limit will be hit | M |
| F06 | P2 | AI Pathology | `js/main.js:177` | `.nav-sticky-wrapper` queried but does not exist in HTML — scroll class never applied | S |
| F07 | P2 | AI Pathology | `html:92-121` | Chamber locations in HTML (Alliance, DCIMCH) differ from `context.md` (Ibn Sina, Alliance) — spec drift | S |
| F09 | P2 | Data | `html:379` | Placeholder email `clinic@example.com` in booking CTA | S |
| F10 | P3 | AI Pathology | `html:190-199` | Before/after slider uses two different images — not a real before/after pair | S |
| F11 | P3 | AI Pathology | `html:300-303` | Testimonial faces use portfolio images as fake patient photos | S |
| F12 | P3 | AI Pathology | `html:207-218` | 10 certification cards all use the same 3 images rotated — not actual certificate images | S |
| F13 | P3 | Code Health | — | Phone numbers and WhatsApp config hardcoded as placeholders | S |
| F14 | P3 | Code Health | — | No CI config | S |
| F15 | P3 | Data | `html:244` | Gallery "managed live via CMS" is misleading — it's client-side localStorage | S |

## Detailed Findings

### F01 — CMS PIN backdoor (P1)
- **File**: `js/main.js:587`
- **Evidence**: `if (pin === cmsConfig.pin || pin === "1234" || pin === "admin")`
- **Impact**: Anyone who knows the word "admin" or the default PIN "1234" (which is displayed in the UI at line 512) can access all patient appointment records, upload photos, and change the doctor's WhatsApp notification number.
- **Fix**: Remove the backdoor. Hash the PIN server-side or use real auth. Since there's no server, at minimum remove the `"admin"` fallback and `"1234"` fallback — only `cmsConfig.pin` should be checked.
- **Blast radius**: Minimal. Changing the login check only affects the auth gate.

### F02 — Patient PII in localStorage (P1)
- **File**: `js/main.js:31-44`, `js/main.js:48-61`
- **Evidence**: `localStorage.setItem("dr_sumya_appointments", JSON.stringify(appointments))` — stores patient names, phone numbers, medical notes, and treatment details in cleartext browser storage.
- **Impact**: Any browser extension, any XSS, any person with physical access to the device can read all patient records. Data persists indefinitely with no expiry. No encryption.
- **Fix**: If this is a real patient booking system, it needs a server-side database with encryption at rest. If it's a demo/prototype, the UI must clearly state "This is a demonstration — data is stored only in your browser and will be lost."
- **Blast radius**: Large — this is an architectural change.

### F03 — No server persistence (P1)
- **File**: `js/main.js:504-560`
- **Evidence**: Booking form submission calls `saveAppointments(appointmentsList)` which writes to `localStorage`. No network request, no server, no email, no SMS to the patient.
- **Impact**: Patients submit their contact info and receive a green "✅ Appointment Saved Permanently!" message — but the data exists only in that browser. If the doctor opens the CMS on a different device, the appointments don't exist. If the browser cache is cleared, all data is gone.
- **Fix**: Add a real backend (Firebase, Supabase, or a simple API), or label the form "Demo Mode — Your appointment request will be noted but not processed until a backend is connected."
- **Blast radius**: Large.

### F04 — Patient data leaked via URL params (P2)
- **File**: `js/main.js:528-540`
- **Evidence**: WhatsApp link generated with full patient details in URL: `📋 *New Appointment Request*\n👤 *Patient:* ${name}\n📞 *Mobile:* ${phone}\n🏥 *Chamber:* ${chamber}\n📅 *Date:* ${date}\n💉 *Service:* ${service}\n📝 *Notes:* ${notes}`
- **Impact**: URLs are visible in browser history, referrer headers, and can be intercepted. Patient data in URL query strings is not encrypted in transit logs.
- **Fix**: Use a POST-based backend API for notifications instead of URL-encoded GET links.
- **Blast radius**: Small.

### F06 — Dead class query (P2)
- **File**: `js/main.js:177`
- **Evidence**: `const navWrapper = document.querySelector('.nav-sticky-wrapper');` — no element with this class exists in `index.html`. The scroll event listener runs but `navWrapper` is always null.
- **Impact**: Missing sticky nav visual effect during scroll. Minor visual regression.
- **Fix**: Either add `nav-sticky-wrapper` to the HTML or remove the dead code.
- **Blast radius**: Minimal.

### F07 — Spec drift on chamber locations (P2)
- **File**: `index.html:92-121`, `context.md:28-37`
- **Evidence**: `context.md` lists "Ibn Sina Diagnostic & Consultation Center" and "Alliance Hospital." The HTML displays "Alliance Hospital Limited" and "Dhaka Central International Medical College (DCIMCH)." Ibn Sina is missing from the live site; DCIMCH is not in the spec document.
- **Impact**: Confusion about which chambers are correct. Potential for out-of-date information being served to patients.
- **Fix**: Align `context.md` and `index.html` to match the real chamber list.
- **Blast radius**: Small.

## What's Actually Good

- The CSS design system is well-crafted — consistent variables, glassmorphism, responsive breakpoints, smooth animations.
- The HTML is semantically structured with proper heading hierarchy and ARIA labeling on interactive elements.
- The `escapeHTML` function exists and is used for user-generated content rendering (though not universally).
- The JS has a clear `DOMContentLoaded` wrapper, event delegation patterns, and reasonable separation of concerns for a vanilla project.
- The mobile navigation drawer, FAQ accordion, and service detail modal work well.
- No heavyweight frameworks or unnecessary dependencies.

## Unverified Suspicions

- Whether the phone numbers and chamber details are accurate — I have no way to verify against reality.
- Whether any real patients have used the booking form and lost their data to localStorage volatility.
- Whether the hero portrait and clinic images are properly licensed.

## Deliberate Non-Findings

- **No server/backend**: This appears intentional from `agent.md` which states "Currently operates as a static client-side application." Flagging it as P1 only because the UI presents it as a real booking system.
- **Placeholder images in certs**: For a template/demo site, using available images is acceptable. Noted as P3 only for completeness.
- **Single HTML file**: Appropriate for a simple portfolio site. No need to split into components.
