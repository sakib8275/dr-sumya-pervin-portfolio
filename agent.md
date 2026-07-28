# AGENT.MD — AI Agent Guidance & Project Manual

Welcome! This document provides operational guidelines, structural context, and coding standards for AI agents and developers working on the **Dr. Sumya Pervin - Aesthetic Medicine & Dermatology Portfolio** codebase.

---

## 1. Project Overview

- **Project Name**: Dr. Sumya Pervin Portfolio Website
- **Domain**: Medical & Aesthetic Dermatology Specialist Portfolio
- **Target Audience**: Prospective patients in Dhaka, Bangladesh seeking clinical dermatology, cosmetic treatments, and dermatosurgery consultations.
- **Tech Stack**: Vanilla HTML5, Vanilla CSS3 (Custom Design System), Vanilla JavaScript (ES6+). No heavy external frameworks or build tools required.

---

## 2. Workspace & File Structure

```
Portfolio Sumya Pervin/
├── index.html                    # Single-page portfolio (652 lines, all markup)
├── css/
│   └── style.css                 # CSS design system & component styles (1581 lines)
├── js/
│   └── main.js                   # All interactive logic (1021 lines)
├── assets/
│   ├── hero_portrait.jpg         # High-res portrait of Dr. Sumya Pervin
│   ├── clinic.jpg                # Chamber / clinic facility photo
│   └── treatment.jpg             # Aesthetic procedure / treatment photo
├── agent.md                      # AI Agent rules & operational guidance (this file)
├── AGENTS.md                     # Points to agent.md
├── context.md                    # Domain context, background & site specifications
├── AUDIT.md                      # Security & code health audit (Round 1)
├── FIXPLAN.md                    # Round 1 remediation plan — all done
├── UX-AUDIT.md                   # UI/UX audit findings (Round 2)
├── UX-FIXPLAN.md                 # Round 2 remediation plan — all done
├── HANDOFF-2026-07-28.md         # Agent handoff doc
└── vibe-code-audit-prompt.md     # Code audit reference prompt
```

---

## 3. Technology Stack & Architectural Principles

### Core Stack
1. **HTML5**: Semantic markup (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).
2. **CSS3**: Native CSS variables (`:root`), flexbox, grid, glassmorphism UI, smooth transitions, responsive media queries.
3. **JavaScript (ES6+)**: Event delegation, DOM manipulation, modal state management, smooth scrolling, interactive sliders/accordions.

### Architectural Rules
- **No Heavy Bundlers/Frameworks**: Keep the project lightweight and fast-loading. Do not introduce React, Vue, build scripts, or Node dependencies unless explicitly requested by the user.
- **Vanilla CSS Priority**: Avoid TailwindCSS or utility frameworks to preserve the custom glassmorphism aesthetic tailored in `css/style.css`.
- **Aesthetic Excellence**: Maintain premium UI visuals—modern typography (Google Fonts Outfit), curated color palettes, subtle glassmorphism cards, micro-animations.

---

## 4. Coding Standards & Best Practices

### HTML Standards
- Maintain clean semantic structure and proper heading hierarchy (`h1` -> `h2` -> `h3`).
- Include explicit `id` attributes on key sections for navigation anchors (`#top`, `#about`, `#chambers`, `#services`, `#results`, `#faq`, `#book`).
- Include `alt` attributes on all images for accessibility.
- Keep interactive button IDs and modal trigger classes distinct and functional.

### CSS Standards
- Define re-usable design tokens (colors, spacing, font weights, border radiuses) in `css/style.css`.
- Use relative units (`rem`, `em`, `%`, `vw`/`vh`) for scalable typography and layout bounds.
- Maintain responsive breakpoints (Mobile: `<768px`, Tablet: `768px-1024px`, Desktop: `>1024px`).
- Preserve glassmorphism styles (`backdrop-filter: blur()`, semi-transparent border/background combinations).

### JavaScript Standards
- Write modular, clean ES6 functions in `js/main.js`.
- Avoid global variable pollution by wrapping script execution or using `DOMContentLoaded` event listeners.
- Gracefully check for element presence before adding event listeners to prevent runtime errors.
- Ensure keyboard accessibility for interactive controls (e.g., closing modals with `Escape` key, focus trapping).

---

## 5. Development & Verification Workflow

### Local Development
To serve and preview the application locally:
- Use any standard static web server, such as:
  - `python3 -m http.server 8000`
  - `npx serve .`
  - Live Server extension in VS Code.

### Verification Checklist
When making code changes or updates, verify the following:
1. **Responsive Layout**: Test on mobile screen sizes (<375px), tablets (768px), and desktops (1280px+).
2. **Interactive Elements**:
   - Mobile navigation toggle (burger menu) opens and closes smoothly.
   - Modal booking popup triggers correctly from all "Book Appointment" CTA buttons.
   - Smooth scroll anchor links navigate to exact section target offsets.
   - Accordions (FAQ section) open/collapse without layout shifts.
3. **Console Hygiene**: Check browser DevTools console for zero JavaScript errors or missing asset warnings.
4. **Data Integrity**: Verify Dr. Sumya Pervin's qualifications, degrees, chamber locations, and appointment phone numbers remain accurate.

---

## 6. Safety & Preservation Rules

> [!IMPORTANT]
> **Preserve Medical Accuracy**: Never modify Dr. Sumya Pervin's professional titles (`MBBS (SSMC)`, `BCS (Health)`, `DDV (BSMMU)`, `FCPS (Skin & VD)`), official designation (`Assistant Professor`), or chamber details without explicit instruction from the user.

> [!CAUTION]
> **Asset Links**: Do not break image source paths (`assets/hero_portrait.jpg`, `assets/clinic.jpg`, `assets/treatment.jpg`). If adding new images, place them in the `assets/` directory.
