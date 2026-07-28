# CONTEXT.MD — Project Background, Domain & Technical Context

This document details the background, medical practitioner profile, chamber information, site features, design system, and technical specifications for the **Dr. Sumya Pervin Portfolio Website**.

---

## 1. Practitioner Profile & Credentials

### Subject Overview
- **Name**: Dr. Sumya Pervin, MD
- **Specialty**: Dermatology, Venereology, Dermatosurgery & Aesthetic Medicine
- **Current Position**: Assistant Professor, Department of Skin & VD, Sir Salimullah Medical College & Mitford Hospital, Dhaka, Bangladesh.
- **Experience**: 14+ years of specialized clinical practice and dermatological surgery.
- **Annual Patient Impact**: 1,500+ procedures performed annually with clinical distinction.

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
   - **Contact / Appointment Hotline**: +880 1700-000000

2. **Dhaka Central International Medical College (DCIMCH)**
   - **Location**: 2/1, Ring Road, Shyamoli, Dhaka
   - **Visiting Days**: Saturday – Wednesday, 3:00 PM – 5:00 PM

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

The single-page web app (`index.html`) is structured into distinct interactive sections:

| Section ID | Section Title | Key Content & Interactivity |
| :--- | :--- | :--- |
| `#top` | **Hero Banner** | High-impact visual header, doctor portrait, official namecard with degree tags, quick CTA buttons. |
| `#about` | **Quick Stats / Profile** | Years of experience counter, qualification badges, academic affiliation at SSMC & Mitford Hospital. |
| `#chambers` | **Chamber Locations** | Interactive location cards, visiting schedules, direct booking triggers per chamber. |
| `#services` | **Services Showcase** | Filterable/categorized list of clinical, cosmetic, and surgical treatments. |
| `#results` | **Results & Testimonials** | Patient success stories, before/after case showcases, patient reviews. |
| `#faq` | **Interactive FAQ** | Collapsible accordion answering common dermatological questions and booking inquiries. |
| `#book` | **Appointment Modal** | Popup appointment booking form with chamber selection, date picker, and direct submission handling. |

---

## 5. Design System & Aesthetic Architecture

- **Visual Theme**: Clean, modern, luxury medical aesthetic combining soft glassmorphism card surfaces with dark/vibrant rich accents.
- **Typography**: Google Fonts **Outfit** (`300`, `400`, `500`, `600`, `700` weights) providing a clean, modern, accessible aesthetic.
- **Color Palette**:
  - Primary Accent: Rich Emerald / Teal Hues (`hsl()` tailored variables)
  - Translucent Overlays: Glass backdrop-blur components (`backdrop-filter: blur(12px)`)
  - Text & Contrast: High-contrast crisp typography for optimal readability across devices.
- **Micro-Interactions**: Smooth scroll transitions, hover elevation on cards, subtle pill badges, button press animations.

---

## 6. Maintenance & Future Enhancements

- **Backend Integration**: Currently operates as a static client-side application. Future additions may integrate Firebase / Node API for direct SMS appointment notifications.
- **Dynamic Content**: Chamber schedules and contact numbers can be dynamically loaded or updated in `index.html` and `js/main.js`.
- **Localization**: Prepared for future bilingual support (English & Bengali).
