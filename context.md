# CONTEXT.MD — Project Background, Domain & Technical Context

This document details the background, medical practitioner profile, chamber information, site features, design system, and technical specifications for the **Dr. Sumya Pervin Portfolio Website**.

---

## 1. Practitioner Profile & Credentials

### Subject Overview
- **Name**: Dr. Sumya Pervin, MD
- **Specialty**: Dermatology, Venereology, Dermatosurgery & Aesthetic Medicine
- **Current Position**: Assistant Professor, Department of Skin & VD, Sir Salimullah Medical College & Mitford Hospital, Dhaka, Bangladesh.
- **Experience** (owner-supplied 2026-10-02, shown as the About stat row): **15+ years in
  medical practice**, including **10+ years in government service** (BCS Health) and **7+ years
  as a dermatology specialist**. (Previously rendered as "14+ years of specialized clinical
  practice" on two stat cards, removed with the cards the same day.)
- **Annual Patient Impact**: “1,500+ procedures annually” was **removed from `public/index.html`
  on 2026-08-02** — an unsourced procedure count is a medical advertising claim on a physician's
  site. Restore only if the practice supplies a basis.

### Academic & Professional Qualifications
- **MBBS**: Sir Salimullah Medical College (SSMC)
- **BCS (Health)**: Bangladesh Civil Service (Health Cadre)
- **DDV**: Diploma in Dermatology & Venereology, Bangabandhu Sheikh Mujib Medical University (BSMMU)
- **FCPS**: Fellow of the College of Physicians and Surgeons (Skin & VD)

---

## 2. Practice Locations & Chamber Details

Dr. Sumya Pervin consults at top diagnostic and hospital centers in Shyamoli, Dhaka:

1. **Alliance Hospital Limited**
   - **Location**: 24/3 Khilji Road (Ring Road), Shyamoli, Dhaka
   - **Visiting Days**: Saturday – Thursday, 5:00 PM – 8:00 PM
   - **Online booking cutoff**: same-day bookings close at **4:30 PM** (30 minutes before
     consultation starts; enforced server-side by `functions/lib/schedule.js` since 2026-08-02).
   - **Contact / Appointment Hotline**: *not yet supplied by the practice.* The site no longer
     ships a placeholder number — the nav entry and floating WhatsApp button populate from
     `/api/config/public` and stay hidden until a real number is entered in CMS Settings.

2. **Dhaka Central International Medical College (DCIMCH)**
   - **Location**: 2/1, Ring Road, Shyamoli, Dhaka
   - **Visiting Days**: Saturday – Wednesday, 3:00 PM – 5:00 PM
   - **Online booking cutoff**: same-day bookings close at **2:30 PM**.

---

## 3. Scope of Medical & Aesthetic Services

The portfolio highlights a comprehensive range of clinical and cosmetic dermatological services:

- **Clinical Dermatology**:
  - Psoriasis, Eczema & Fungal Infection Management
  - Chronic Skin Allergy & Urticaria Treatment
  - Pediatric & Geriatric Skin Care
- **Cosmetic Dermatology & Anti-Aging**:
  - Laser Hair Removal & Pigmentation Laser Therapy
  - Chemical Peels & Skin Rejuvenation
  - Anti-Aging Treatments, Botox & Dermal Fillers
  - PRP (Platelet-Rich Plasma) Therapy for Hair Loss & Skin Renewal
- **Dermatosurgery**:
  - Mole, Wart & Skin Tag Removal (Electrocautery / Radiofrequency)
  - Cyst Excision & Scar Revision
  - Acne Scar Subcision & Microneedling

---

## 4. Key Website Sections & Interactive Components

The single-page web app (`public/index.html`) is structured into distinct interactive sections:

| Section ID | Section Title | Key Content & Interactivity |
| :--- | :--- | :--- |
| `#top` | **Hero Banner** | High-impact visual header, arched **credential plate** (the doctor's photograph was removed at her request, 2026-10-03) carrying the SP monogram, name, specialty and MBBS/DDV/FCPS/BMDC degree tags, quick CTA buttons. |
| `#about` | **Profile** | Intro paragraph (CMS-editable) + type-only stat row: 15+ years medical practice / 10+ years government service / 7+ years dermatology specialist. |
| `#chambers` | **Chamber Locations** | Interactive location cards, visiting schedules, direct booking triggers per chamber. |
| `#services` | **Services Showcase** | Filterable/categorized list of clinical, cosmetic, and surgical treatments. |
| `#results` | **Results & Testimonials** | Patient success stories, before/after case showcases, patient reviews. |
| `#faq` | **Interactive FAQ** | Collapsible accordion answering common dermatological questions and booking inquiries. |
| `#book` | **Appointment Modal** | Popup appointment booking form with chamber selection, date picker, and direct submission handling. |

---

## 5. Design System & Aesthetic Architecture

- **Visual Theme** (since 2026-10-03): **Nil & Haldi** — Bengal indigo and turmeric on unbleached
  paper. Indigo is the complement of brown skin, so the frame recedes and skin in photographs reads
  true; turmeric is the one rare warm signal. Tokens and rationale: `public/css/site.css` `:root`
  (mirrored into `style.css` for the admin panel; legacy gold names survive there as aliases).
- **Typography**: Google Fonts **Outfit** (+ Hind Siliguri for Bangla).
- **Color Palette**:
  - Grounds: `--paper` #F7F3EA, `--paper-2` #EFE8DA, `--surface` #FFFDF8; dark grounds `--nil-deep` #1A2756
  - Text: `--ink` #1C2233, `--ink-2` #4F5568; on indigo `#fff` / `--on-nil` #C9D1EA
  - Brand & action: `--nil` #23336B (buttons, links, prices, focus ring)
  - Accent: `--haldi` #E0A526 as a fill or mark only (2:1 on paper); `--haldi-ink` #8A5A00 when it must be text
  - No gradients under text. Every pairing is pinned in `tests/contrast.test.mjs`.
- **Motion**: one authored moment — the home hero entrance (headline settles out of a blur, the
  nameplate arch fills with indigo, the turmeric underline draws under "diagnosis"). Supporting
  motion only explains state: the package sheet grows out of the tapped fee card (View Transitions,
  keyframe fallback), menus settle 6px, buttons sink 2% on press. Everything has a
  `prefers-reduced-motion` path.

---

## 6. Maintenance & Future Enhancements

- **Backend Integration**: No longer a client-side-only application. Bookings, contact messages, and
  gallery items persist to Cloudflare D1 via Pages Functions in `functions/`, with images in R2.
  Still outstanding: nothing notifies the doctor when a booking arrives — she must check the CMS.
  The planned fix (FIXPLAN-2026-08-02.md, F8) is a scheduled worker emailing a per-chamber daily
  digest after each chamber's 30-minute booking cutoff; it needs the practice's email address.
- **Dynamic Content**: Chamber schedules live in `public/index.html`. Contact numbers are **not**
  hardcoded any more; they come from `/api/config/public` and are edited in CMS Settings.
- **Localization**: Prepared for future bilingual support (English & Bengali).
