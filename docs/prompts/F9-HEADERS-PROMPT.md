# PROMPT — F9: security headers, starting with the inline-handler refactor

Paste this into a fresh agent session. Everything it needs is in the repo; the
pointers tell it what to read first and what "done" means.

---

You are picking up the Dr. Sumya Pervin portfolio at
`/home/kitahara-poposagain/Desktop/Portfolio Sumya Pervin` (branch `master`,
Cloudflare Pages + D1 + R2, plus one standalone cron Worker). The site is **live
and serving patients** — treat every change as production.

**Read first, in this order:** `STATUS.md` →
`docs/handoffs/HANDOFF-2026-08-03-v3.md` → `FIXPLAN-2026-08-02.md` §Phase 2 row
F9 → `agent.md` (architecture, security rules, deploy/verify checklist) →
`functions/_middleware.js` → `public/index.html` and `public/js/main.js`.

If anything in this prompt disagrees with `STATUS.md`, **`STATUS.md` wins** — say
so in your report rather than quietly following the prompt.

## Task

Ship **F9 — security headers**. It is two pieces of work in a fixed order, and
the order is the whole point:

**Step 1 — remove every inline event handler.** The FIXPLAN counts 3 generated
and 8 static `onclick` attributes; **re-count them yourself, do not trust that
number**. Replace them with delegated listeners or `data-` attributes wired up in
`public/js/main.js`. The generated ones (built as HTML strings in JS) are the
easy ones to miss.

**Step 2 — only then add the CSP.** In `functions/_middleware.js`:

```
script-src 'self' challenges.cloudflare.com;
frame-src challenges.cloudflare.com;
style-src 'self' 'unsafe-inline' fonts.googleapis.com;
img-src 'self' https: data:;
frame-ancestors 'none';
```

plus `Permissions-Policy` and — **only because L5 (Full strict + Always HTTPS) is
confirmed live** — `Strict-Transport-Security`. Check L5 in `STATUS.md` before
you send HSTS; it is close to irreversible on a domain that is not fully HTTPS.

**Why the order matters:** a CSP without `'unsafe-inline'` in `script-src` kills
every remaining inline handler **silently**. The button simply stops working. No
console error the user will ever see, no failed request, no test failure — the
booking modal just does nothing. If you add the CSP first "to see what breaks",
what breaks is patient bookings, in production.

## Gates (all mandatory)

- `npm test` green — **173/173 before you start**, and green again before any
  deploy. If it is not 173 on arrival, stop and report; something drifted.
- **Click-through the whole site after the CSP**, in a real browser: every
  "Book Appointment" CTA, the booking modal submit, the mobile burger menu, the
  FAQ accordions, the gallery, and the full CMS (login, Update Status, Upload
  Photo, Settings save). Automated tests do not cover the DOM layer yet — that is
  F10 — so this is the only thing standing between a broken CSP and patients.
- Watch the browser console for CSP violation reports during that pass.
- Deploy with `npx wrangler pages deploy` from the repo root. Verify the headers
  land with `curl -I https://drsumyapervin.com/` and re-run the exposure checks in
  `agent.md`.
- **Rollback target is `5423d45e`** — but confirm it against
  `npx wrangler pages deployment list --project-name=dr-sumya-pervin-portfolio`
  before quoting it. Deployment ids drift; two wrong ones have already circulated
  in this repo's history.

## Standing rules for this repo

- Remote D1 **writes** and `pages secret put` are **operator-run**. You SELECT
  only, unless the operator tells you otherwise in the moment.
- Never print or record the admin PIN; check secrets by presence only.
- Turnstile widget hostnames are dashboard-only (the OAuth API returns 10405).
- Nothing outside `public/` may ever be published — `tests/exposure.test.mjs`
  enforces this; add to it if you add files.

## Also open, if you finish F9 or get blocked

1. **F8's last mile.** The digest worker is deployed and proven up to the send;
   it is waiting on a human clicking Cloudflare's verification email in
   `dr.enamtalha@gmail.com`. If the operator says that is done: force one cron
   run, confirm a real email arrives, create the inbound `digest@` routing rule
   (previously rejected with `2054`), and record in the logs **which** send path
   worked — that finally settles which `send_email` API generation this account
   uses, and lets the fallback in `workers/digest/index.js` be deleted.
2. **An application-level login throttle** in `functions/api/auth/login.js`
   (D1- or KV-backed, keyed on the PIN attempt). The zone's WAF rule is only a
   managed challenge, not a rate limit, and the Free plan's single rate-limit
   slot is deliberately spent on leaked-credential blocking. See
   `HANDOFF-2026-08-03-v3.md` §5 for the reasoning. Not yet in the FIXPLAN —
   propose it before building it.
3. `drsumyapervin.com.txt` in the repo root is a stale DNS export (predates the
   Email Routing MX/SPF/DKIM records). Regenerate or delete it.

## Done means

1. Zero inline handlers; CSP live; `npm test` green.
2. The full click-through pass done **by a human or a real browser session**, with
   what you exercised listed explicitly. If you could not exercise something, say
   which and why — do not imply coverage you do not have.
3. `STATUS.md` updated (living record), FIXPLAN F9 marked, and a new
   `docs/handoffs/HANDOFF-<date>.md` per house convention.
4. `agent.md` updated if the middleware's documented behaviour changed.
5. Commit locally; confirm with the operator before pushing.
