# Content map: what owns which text

| What a patient reads | Source of truth | Notes |
|---|---|---|
| Name, phone, email, WhatsApp link, credentials list, review dates | `content/site.mjs` `SITE` | The build stamps WhatsApp on `<body data-wa>`. Never hardcode a number in JS |
| Chamber days, hours, same-day cutoff | `functions/lib/schedule.js` `CHAMBERS` | Imported by `content/site.mjs` **and** enforced by the booking API. The digest Worker's crons derive from it (`tests/digest.test.mjs`) |
| Chamber names and places, nav, footer, launch gates | `content/site.mjs` | `ACTIVE_GATE` hides rows tagged beyond the live phase |
| Every page's path, `<title>`, meta description, condition list | `content/sitemap.mjs` | Docx §3.2 verbatim. The skin-check tool reuses the condition blurbs |
| Condition, treatment, aesthetic, visit and learn articles | `content/pages/content/*.mjs` (registry: `content/pages/content.mjs`) | Transcribed from docx Part 5 |
| Home, prices, about, ethics, book, tools pages | `content/pages/*.mjs` | Bespoke bodies |
| Price list, inclusions, who performs it (Dr / Dr+N / N), package views | `content/prices.mjs` | Docx Part 6 verbatim. Tests pin the load-bearing figures |
| Guideline references at the foot of clinical pages | `content/references.mjs` | Header says **draft for clinical approval**. Do not add citations the owner has not confirmed |
| Bangla summaries | `content/bn.mjs` | Render only with `approved: true` from the doctor |
| Brand mark, share card, touch icon, logo PNG | `content/brand.mjs` → `npm run build:brand` | Commit the regenerated PNGs |
| The docx itself | `Change Request/*.docx` → `python3 scripts/extract_change_docx.py` → `content/source/website-content.md` | Re-extract. Never hand-edit the markdown |

## Not driven by the build (edit in place)

- `public/admin/index.html`, `public/js/*.js`, `public/css/*.css`, `public/robots.txt`,
  `public/favicon.svg`.
- The `:root` token block must stay identical in `site.css` and `style.css`
  (a test enforces this). `DESIGN.md` explains the tokens.

## Stored, but not shown on any public page

Since the multi-page rebuild no public page fetches `/api/content`, `/api/gallery`,
`/api/uploads/*` or `/api/config/public` (the uptime probes still call the last one).
Editing CMS **Site Content**, **Gallery** or **Settings → WhatsApp/Telegram** therefore
changes nothing a patient sees. To change public copy or the WhatsApp link, edit the
sources above.
