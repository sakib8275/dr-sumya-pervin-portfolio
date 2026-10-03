---
target: homepage (public/index.html) + representative pages
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/home/kitahara-poposagain/Desktop/Portfolio Sumya Pervin/public/index.html"
target_fingerprint: "sha256:c88ad045845287497ce83739080604fe61486ca50d6abe7a7a77a5eafa4a8d39"
target_path: /home/kitahara-poposagain/Desktop/Portfolio Sumya Pervin/public/index.html
timestamp: 2026-10-03T08-36-00Z
slug: public-index-html
---
Method: dual-agent (A: design-review agent · B: detector + browser agent)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Unclear which prices apply today (Centre tiers vs hospital tariff; only hospital chambers bookable) |
| 2 | Match System / Real World | 2 | English only; dermoscopy/trichoscopy/Wood's lamp/DPN/KOH/"Dr+N" unexplained |
| 3 | User Control and Freedom | 3 | Drawer excellent; booking request can't be reviewed/edited |
| 4 | Consistency and Standards | 2 | Chips look tappable but are spans; mega ~30 links vs drawer 13 |
| 5 | Error Prevention | 1 | Booking default Alliance+Morning impossible; past dates/closed days accepted |
| 6 | Recognition Rather Than Recall | 2 | Consultation-type select has no price/duration; fee list below form on mobile |
| 7 | Flexibility and Efficiency | 3 | Sticky Call/WhatsApp/Book bar, mega-menu deep links |
| 8 | Aesthetic and Minimalist Design | 2 | 7 of 10 home sections share one eyebrow+h2+card-grid weight |
| 9 | Error Recovery | 2 | Phone error contradicts placeholder; Turnstile error has no fallback |
| 10 | Help and Documentation | 2 | /faq/, /contact/, /learn/, skin-type tool not in header/drawer/footer |
| **Total** | | **21/40** | **Acceptable** |

## Design Specificity Verdict
Copy authored for this doctor (ethics list, brown-skin mole rule, serials, discreet invoicing); structure is the stock SaaS landing sequence. Zero public images (clinic.jpg/treatment.jpg unused), no Bangla, no first-person voice since portrait removal. Detector: 549 findings — 193 thin-border+wide-shadow (one .mega component), 65 skipped-heading (footer h4, every page), hero low-contrast (TP for eyebrow/sub/alt/tlink; FP for h1), 3 side-tabs, em-dash overuse ×8, tiny-text ×4; 198 cramped-padding FP. Overlay blocked by CSP on all pages.

## Priority Issues
- [P1] "Published prices" not true for anything bookable today — Centre tiers shown without "at the Centre", hospital tariff in small print, VAT only on /prices/, Signature same-visit lab likely Centre-only. /impeccable clarify
- [P1] Booking form invites impossible requests — Morning default vs 3–8 PM chambers, no min date / closed-day block, sbRemind never sent, no noscript fallback. /impeccable harden
- [P1] Identity text unreadable — hero eyebrow/tlink ~2:1, sub-copy 3.9:1, footer name 1:1 on all 64 pages. /impeccable colorize → polish
- [P2] Wayfinding gaps — Contact/FAQ/Learn absent from nav/drawer/footer; drawer has no conditions; no phone/address/hours in footer; u-bar phone not a link. /impeccable layout
- [P2] Template body, no imagery/Bangla/voice; ethics band buried 7th. /impeccable bolder (+ typeset)

## Persona Red Flags
Jordan: tiers have no Book CTA; "long-standing" undefined; jargon; inert chips; no directions in nav; chamber caveat in 13.5px grey.
Casey: /prices/ sticky stack ~30% viewport; ~10-screen home; fees below 8-field form; sticky Book links to current page; slow Turnstile = cryptic error.
Riley: Alliance+Morning accepted; yesterday/Friday accepted client-side; reminders ignored; Signature at hospital accepted; " · ." on 3 condition pages; mole tool promises a priority slot the form lacks; Centre rooms for a 2027 building.

## Minor Observations
5/8 cognitive-load checks fail (mega menus 12 links, chips 8/6/6, 5-option select). ✓ glyphs read aloud. Mega opens on focus-within. "৳0" vs "free". Turnstile dark theme. Templated "Not sure whether this is you?" ending everywhere. .h-final-inner unused.

## Questions to Consider
- If "Inside the Centre" left the homepage until 2027, would anything bookable today get weaker?
- What does the page look like with the ethics band second instead of seventh?
- Is English-only quietly filtering for wealthier patients — decision or accident?
