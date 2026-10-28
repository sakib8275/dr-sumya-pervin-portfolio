---
name: edit-content
description: Change patient-facing copy, prices, chamber facts or pages on drsumyapervin.com through the content/ → public/ build, with the medical-accuracy and docx-is-truth checks. Use for any edit that would change what a patient reads.
---

# Edit content

The public site is generated. `public/**/index.html`, `404.html` and `sitemap.xml`
are build output. A hand edit there is overwritten by the next build and drifts from
its source in the meantime.

## Steps

1. **Find the source.** Read `references/content-map.md` and open only the module
   that owns the text. If the text lives in `public/admin/`, `public/js/` or
   `public/css/`, it is hand-maintained, so edit it in place and skip step 4.
2. **Check the request against the owner's truth.**
   - Copy and prices come from the docx, extracted to
     `content/source/website-content.md`. If the request contradicts that file, stop
     and ask the owner which one wins. Never "fix" the docx extract by hand.
   - Credentials, titles and chamber facts: read `context.md` §1–2 first. Never write
     "MD". "Assistant Professor" and "BCS (Health)" are past roles.
   - Add no unsourced claims: no procedure counts, no "guaranteed", no "best",
     and no before/after promises.
   - Bangla text in `content/bn.mjs` stays `approved: false` until Dr. Sumya approves
     it. Never flip the flag.
3. **Edit the source module.** Match its voice: plain, specific, doctor-led. HTML
   entities stay as they are written there (for example `&amp;` in nav labels).
4. **Build:** `npm run build:site`. Then run `git diff --stat public/` and confirm
   that only the pages you meant to change moved. `sitemap.xml` always moves because
   of `<lastmod>`, and that is expected here.
5. **Gates:**
   - `npm test`. `tests/pages.test.mjs` checks every sitemap page, every internal
     link, unique SEO, docx price figures verbatim, no inline handlers and the
     Bangla approval gate. Contrast and token parity have their own tests.
   - `npm run test:e2e` if the change touches `public/js/`, a form, the booking
     flow, prices or package views, or the tools.
6. **Look at it.** Render each touched page at 375px and 1440px (`npm run dev`, or a
   Playwright screenshot against the harness) and check wrapping, tap targets
   (at least 44px at phone width) and that no price, chamber or credential changed
   unintentionally.
7. **Commit sources and output together**, for example
   `fix(content): correct the melasma follow-up interval`, and push to a branch.
8. **It is not live yet.** Patients see it only after `/deploy-verify`. Say so
   when you report back.

## References
- `references/content-map.md`: which module owns which text, and what is *not*
  driven by the build.
