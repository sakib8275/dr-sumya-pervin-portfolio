# STATUS.md — Current state (living document)

**The only state document that is kept current.** Update it whenever deployment,
verification, or owner-action state changes. Everything under `docs/` is a dated
snapshot; if this file and a snapshot disagree, this file wins.

**Updated:** 2026-08-05 (~17:40 UTC / 23:40 Dhaka) — **F13 + F14 shipped** (see
the F13/F14 row below): the Settings form's required-but-dead `admin_email` field
is wired end-to-end (GET/PUT on `/api/config`, populated on load, saved on
submit, validated server-side; `/api/config/public` still returns exactly
`{whatsapp, telegram}`), and the CMS PIN fields now carry
`autocomplete="new-password"` so browsers stop offering to save the PIN (the
Task-0 transcript-leak vector). Deployed `a5077cb3`, committed + pushed
`3a00d4f`; **247/247 node tests + 14/14 e2e green.** F15 recorded only (no login
throttle is a deliberate decision). Earlier: **F11 is now FIXED: the
uptime monitor works and the crying-wolf is gone.** Production D1 is **clean**
(0 appointments, 0 gallery), **F8's digest** runs green from its own logs, and
the one open engineering item — the uptime monitor, which had failed **9/9**
scheduled runs with a Bot Fight Mode 403 on GitHub Actions' Azure IPs — is
replaced. The **authoritative monitor is now `workers/probe`**: a Cloudflare-
native Worker on its own 30-min cron (deployed 2026-08-05 15:30 UTC, version
`c7d0aced`) that probes `/api/config/public` **from Cloudflare's own network**
(verified: a Worker subrequest returns 200 with the JSON contract, where GitHub
runners got 403 on every attempt) and emails the doctor once on the DOWN
transition and once on RECOVERY. The **GitHub Actions workflow is demoted to a
third-party canary** that treats a cf-mitigated edge block as the expected
state of its own vantage point, so scheduled runs stay green instead of
spamming the owner's inbox. ⚠️ **Timestamps written earlier on 2026-08-04 were
taken from a machine clock that was ~9 h 24 m slow**; it has since synced and
now agrees with network time. Anything in this file dated "2026-08-04 21:xx
UTC" was really 2026-08-05 ~06:xx UTC. On 2026-08-04, **the Phase 2 build work
was closed.** Two deploys shipped: `fb1b3aa8` (the pending UX batch, including
the critical quiz-booking fix) and `42aa5567` (F11 + one new bug fix). **F10**
landed as 14 Playwright tests, **F11** as a CI gate, an uptime monitor, a
proven D1 backup/restore runbook and structured write logs, **F12** as this
update. F10 immediately earned its keep by catching a **latent bug**:
`.fab-btn { display: grid }` outranked the `[hidden]` attribute, so
`main.js`'s `fab.hidden = !digits` never hid anything and an unconfigured
WhatsApp number would have shown a dead `href="#"` button. Fixed and deployed.
Earlier on 2026-08-04: the doc-validity audit, the UX audit, L6, and Workers
Logs on the digest.

---

## The one-**The site is LIVE on `drsumyapervin.com`** (deployment **`a5077cb3`** — F13/F14, commit `3a00d4f`; **247/247
node tests + 14/14 Playwright e2e green**; Self-Service CMS with PIN Reset, TOTP 2FA, and Site-Content Editing built & fully tested), **F9 security headers are live** (CSP with no
'unsafe-inline' in `script-src`, HSTS, zero inline handlers left in `public/`),
and **the F8 digest worker is DEPLOYED, crons registered, recipient verified,
Workers Logs on** — nothing blocks it; its first live run was **2026-08-04 08:30
UTC (14:30 Dhaka)** and is now **proven end-to-end in production from its own
logs** — see the "Digest first run" row. **L6 is done** — the owner's
`+8801725196101` is live in production D1, so booking confirmations reach
WhatsApp. **FIXPLAN Phase 2 (F8, F9, F10, F11, F12) + Self-Service CMS (2FA, PIN Reset, Site Content) are built, verified, and ready.**

✅ **Production D1 is clean** — the operator deleted the three deploy-verification
bookings on 2026-08-04; re-probed as 0 appointments, 0 gallery. The digest can no
longer email the doctor a list of fake patients.

## Verified right now

| Fact | State | Verified |
|---|---|---|
| Serving deployment | **`a5077cb3`** (commit `3a00d4f`, pushed to origin) — F13/F14: `admin_email` wired through Settings + PIN autocomplete hardening | `pages deploy` + apex curl, 2026-08-05 |
| Previous deploy | `42aa5567` — F11 logging + the `[hidden]` fix. Back out to this if F13/F14 misbehaves | `pages deploy`, 2026-08-05 |
| Rollback target | **`5423d45e`** (last pre-Phase-1 known-good) — full id `5423d45e-78fd-48ea-abe8-1ce5d5bd0917`, re-confirmed against `pages deployment list` | 2026-08-03 |
| Previous good deploy | `f64b9221` (pre-F9), if F9 alone needs backing out | same |
| Apex / www / HTTPS | apex 200; www → 301 apex; http → 301 https | curl, 2026-08-03 |
| Tests | **247/247 green** (`npm test`; Miniflare + real compiled worker, plus 24 TOTP/Reset/Content units, 16 digest units, 18 F9 header/inline-handler/exposure units, 5 structured-log units, 13 probe units, and 6 F13 config/admin_email units). Plus **14/14 `npm run test:e2e`** (F10). All pass green under Node 24 | 2026-08-05 |r each of the two deploys | 2026-08-04 |
| **F13 + F14** | ✅ **DONE 2026-08-05, deployed `a5077cb3`, commit `3a00d4f` pushed.** F13: the Settings form was unsaveable — `adminEmailInput` is `required` but `loadCMSConfigForm()` never populated it, so native validation blocked every save, and whatever was typed was discarded (the only writer was operator SQL). Now wired end-to-end: `/api/config` GET returns `admin_email`, PUT accepts/validates it (same regex as the forgot-password path, ≤254, `''` clears) and persists it in the same single UPDATE as the PIN rotation / channel writes; `loadCMSConfigForm()` fills the field, the submit handler sends `admin_email`. Logged as `admin_email_set: <bool>` — never the address (redaction contract in `functions/lib/log.js`). `/api/config/public` is untouched — still exactly `{whatsapp, telegram}` (leak-guard test added). F14: `autocomplete="new-password"` on `cmsPinInput`/`resetNewPin`/`resetConfirmPin`, `autocomplete="email"` on `forgotEmailInput` — closes the 2026-08-03 PIN-autofill/transcript vector (HUMAN-TASKS Task 0's "related, smaller" item). F15 recorded only (no app-level login throttle is a deliberate decision; Turnstile-first ordering is the fast-path defense). Specs + owner note (mailer `ALLOWED_RECIPIENT` must change before `admin_email` may differ from `dr.enamtalha@gmail.com`): `FIXPLAN-2026-08-05.md`. Smoke verified on pages.dev: public route exactly two keys, admin route 401, 4 autocomplete attrs served. **Remaining manual (operator, PIN+TOTP):** Settings loads the stored `admin_email` and Save works without typing it | `npm test` + e2e + curl, 2026-08-05 |
| **F10 DOM layer** | **DONE.** `tests/e2e/` — 14 Playwright tests over the five required areas: real pointer-click booking, XSS inert in the CMS, booking-failure state, WhatsApp CTA gating, pre-hydration submit guard; plus the UX batch's assertions. Runs on the **Miniflare harness, not `wrangler pages dev`** — `pages dev` cannot intercept siteverify, so every DOM booking test would 403 under it for a non-DOM reason. `npm run test:e2e`, kept out of `npm test` so the deploy gate stays ~3 s | `npm run test:e2e`, 2026-08-04 |
| **F11 ops** | **DONE — see the Uptime monitor row.** `.github/workflows/ci.yml` (`npm test` + e2e on push/PR; **never deploys**) ✅, `npm run backup:d1` + `docs/RUNBOOK-BACKUP.md` (**restore drill proven**: exported 4/4 tables, replayed into a wiped local D1, counts matched) ✅, JSON write logs ✅, uptime monitor ✅ (**now `workers/probe`, deployed**) | see rows below, 2026-08-05 |
| ✅ **Uptime monitor** | **FIXED 2026-08-05.** The GH-Actions monitor failed **9/9** scheduled runs: the zone's Bot Fight Mode (auto-enabled, non-disableable on this plan) challenges Azure datacenter IPs with a `cf-mitigated` 403 while real clients get 200. It was **worse than no monitor** — a probe that always cried wolf gets ignored. **The authoritative monitor is now `workers/probe`** (`dr-sumya-probe`, version **`c7d0aced`**, deployed 2026-08-05 15:30 UTC): a Worker on its own `*/30 * * * *` cron that probes `/api/config/public` **from Cloudflare's own network** — a vantage Bot Fight Mode cannot challenge (verified live from a throwaway Worker: 200 + the JSON contract, 4/4 runs; GH runners got 403 on every attempt). It asserts the **JSON shape**, not a bare 200, and **emails the doctor once on the DOWN transition and once on RECOVERY** (consecutive-failure state in the `uptime_state` single-row table, `migrations/002_uptime_state.sql`). `.github/workflows/uptime.yml` is **demoted to a third-party canary**: it treats a cf-mitigated edge block on any of its three steps as the expected state of its own vantage and passes, so scheduled runs go green and stop spamming the owner, while a dead Function (5xx/timeout/wrong shape), a broken homepage, or lost HSTS/CSP still fail it. 13 new probe tests (217 total). Note: `HEAD` on the endpoint still 404s while `GET` 200s — do not write a HEAD probe | `wrangler deploy` + D1 SELECT + live probe, 2026-08-05 15:30 UTC |
| CI on GitHub | ✅ **GREEN on its first real run** — run `30874041644` on push of `c6da817`: both jobs passed (`npm test` 28 s; **Playwright DOM layer 59 s**, browser download and all, on a bare runner). Red is **proven locally**: renaming `validateSlot` made `npm test` exit **1**; reverting returned exit **0** and 204/204. The Node-20 deprecation annotation is **cleared**: all three actions bumped to `@v5` (checkout, setup-node, **and upload-artifact** — that one never appeared in the annotation only because it sits behind `if: failure()` and had not run, so it would have bitten on the first red build, exactly when the traces are needed). `@v5` is the version that moves to Node 24; note **v7 is the current latest** if a future bump is wanted, and setup-node v5+ auto-caches when `package.json` has a `packageManager` field — this repo has none, and `cache: npm` is set explicitly | `gh run view`, 2026-08-05 |
| Write logs live | **proven in production.** A real apex booking emitted `{"evt":"appointment.create","ts":"…","id":"book-5f67ef11","chamber":"Alliance…","appointment_date":"2026-08-08","service":"…","ok":true,"ms":88}` — **no patient name, no phone**. Read with `npx wrangler pages deployment tail <full-uuid> --project-name=dr-sumya-pervin-portfolio --format json`; `--environment production` alone is rejected non-interactively | `pages deployment tail`, 2026-08-04 |
| **Bug found by F10** | `.fab-btn { display: grid }` outranked the `[hidden]` attribute (a UA rule), so `main.js:164`'s `fab.hidden = !digits` **hid nothing** — with no WhatsApp number configured the floating button still rendered as a live link to `href="#"`, the exact "live link to nobody" the gating was written to remove. `#navTel` escaped only because `.nav-tel` sets no `display`. Fixed with `[hidden] { display: none !important; }`, deployed in `42aa5567`, verified on the apex | `tests/e2e/whatsapp-gating.spec.mjs` + apex probe, 2026-08-04 |
| **F9 security headers** | **LIVE on apex.** CSP (`script-src 'self' 'nonce-…' challenges.cloudflare.com static.cloudflareinsights.com`, no `'unsafe-inline'`; `frame-ancestors 'none'`, `object-src 'none'`, `base-uri`/`form-action 'self'`), `Permissions-Policy`, `HSTS max-age=31536000; includeSubDomains` (no preload), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` | `curl -I` + browser console, 2026-08-03 |
| Inline event handlers | **zero in `public/`** — 12 removed (8 `onclick` + 1 `onsubmit` in index.html, 3 generated `onclick` in main.js). `tests/headers.test.mjs` fails if one returns | `npm test` + DOM probe, 2026-08-03 |
| CSP violations in browser | **0** across a full local click-through and a full production pass | Playwright console capture, 2026-08-03 |
| F8 digest worker | **DEPLOYED** — `dr-sumya-digest`, live version **`0f6d80cd`** (2026-08-03 22:16 UTC; supersedes `e89ceefb`), crons `30 8 * * SUN-WED,SAT` + `30 10 * * SUN-THU,SAT` registered; no public URL (`workers_dev = false`, probe 404) | `wrangler deployments list`, 2026-08-03 22:2x UTC |
| Digest observability | **ON** — `[observability] enabled = true, head_sampling_rate = 1` in `workers/digest/wrangler.toml`, confirmed on the deployed script (`logs.enabled true`, `persist true`, `invocation_logs true`). Enabled *before* the first scheduled run for one reason: this Worker's only trigger is cron and its only output is an email nobody in this repo can read, so **"no mail arrived" and "nothing to report" are the same observation** without logs | Cloudflare API, 2026-08-03 22:16 UTC |
| **Digest first run** | ✅ **OBSERVED AND GREEN — Phase 2's last open item, now closed.** Both crons fired on 2026-08-04 and both sent: `digest: sent Alliance Hospital Limited (Shyamoli) 2026-08-04 (0 bookings) to dr.enamtalha@gmail.com` and the same for `Dhaka Central International Medical College (DCIMCH)`. Cron strings in the logs match the registered pair (`30 8 * * SUN-WED,SAT`, `30 10 * * SUN-THU,SAT`). **Zero errors or warnings** — all logs for the whole of 2026-08-04 are `level: info`, count 2. The Dhaka date resolved to `2026-08-04`, so the date logic is right in production, not just under `--test-scheduled`. **Note it emails on empty days by design** (`digest.js:134` — "No appointments were booked for today."), so silence from now on means *breakage*, not "no bookings" — the inverse of the pre-observability situation | Workers Logs via observability API, 2026-08-05 06:15 UTC |
| **F11 probe worker** | **DEPLOYED 2026-08-05 15:30 UTC** — `dr-sumya-probe`, version **`c7d0aced`**, cron `*/30 * * * *` registered, `workers_dev = false` (no HTTP entry point). Bindings: `DB` (the same `dr-sumya-pervin-db`, used only for the single `uptime_state` row), `EMAIL` (send_email), vars `PROBE_FROM`/`PROBE_TO` (same verified recipient as the digest) / `PROBE_URL`. First scheduled run writes `id=1` into `uptime_state`; verify with `npx wrangler d1 execute dr-sumya-pervin-db --remote --command "SELECT * FROM uptime_state"`. Logs via Workers observability (`head_sampling_rate = 1`). The same `wrangler tail` / observability caveats as the digest apply — its output is an email + a log line, not a URL | `wrangler deployments list` + D1 SELECT, 2026-08-05 |
| Reading digest logs (method) | `wrangler tail` is **live-stream only** and cannot reach a past run; use the observability API. The Cloudflare MCP `query_worker_observability` **`events` view fails schema validation** on this worker (`outcome` undefined → zod `invalid_union`) — that error means the tool cannot *parse* the logs, **not** that no logs exist. The `calculations` view works: `count` grouped by `$metadata.message`, filter `$metadata.service eq dr-sumya-digest`. Group by `$metadata.level` to check for errors | 2026-08-04 |
| Digest end-to-end | **proven up to the send**: forced scheduled run on remote bindings routed Alliance → Dhaka date 2026-08-03 → production D1 query OK → both send paths rejected only with "destination address is not a verified address" | `wrangler dev --remote --test-scheduled`, 2026-08-03 |
| Email Routing (zone) | **enabled, status `ready`** — MX ×3 + SPF + DKIM (`cf2024-1._domainkey`) created automatically | Cloudflare API, 2026-08-03 |
| Digest recipient | `dr.enamtalha@gmail.com` — **`verified` 2026-08-03 16:13 UTC** (owner opened the link). The send path is now unblocked; **no cron has fired since the 15:10 UTC deploy**, so the first live digest is 2026-08-04 08:30 UTC / 14:30 Dhaka | Cloudflare API, 2026-08-03 22:07 UTC |
| Inbound `digest@` rule | **not created, and not required** — proven by the 2026-08-04 run, which sent from `digest@drsumyapervin.com` with no such rule. The `send_email` binding is authorised by **Email Routing being enabled on the zone**, not by an inbound rule (`workers/digest/wrangler.toml:47`). The zone has only a disabled catch-all `drop`, so the sole consequence is that **a Reply to a digest reaches nobody** — it bounces or is rejected. Create it only if the doctor might reply; needs an API token with Email Routing edit scope (wrangler OAuth lacks it) | Cloudflare API + live run, 2026-08-04 |
| L7 login rule | ✅ **done — nothing outstanding.** This row is a *doc correction*, not an open task: L7 had been recorded as a rate limit, but it is a `managed_challenge` on every `POST /api/auth/login`, which is live and protecting the endpoint. The zone's one rate-limiting rule is `Leaked credential check` (block, 5/10s); the free plan allows exactly one and that is the better use of the slot. **Deliberately kept as-is — do not "fix" this** | zone rulesets, 2026-08-03 |
| Booking guard live | tokenless POST on apex → 403; real widget booking succeeded | curl + D1, 2026-08-03 |
| Repo-root exposure | closed — internals all 404 @ 2,589 B (the 404 page grew when F9's markup changed; still 404, still nothing internal served) | curl, 2026-08-04 |
| SEO/OG | canonical, OG/Twitter, JSON-LD, robots.txt, sitemap.xml, favicon.svg live | curl, 2026-08-02 |
| Production D1 | ✅ **clean — 0 appointments, 0 gallery.** The three deploy-verification smoke rows (`book-af0a8c84` 08-05, `book-e879acc5` 08-06, `book-5f67ef11` 08-08, all named `ZZ TEST — …`) were deleted by the operator on 2026-08-04, hours before the 08-05 row would have surfaced in that day's digest. Agents remain SELECT-only on remote D1 | D1 `SELECT COUNT(*)` ×2 (`served_by: v3-prod`), 2026-08-05 06:05 UTC |
| WhatsApp/Telegram | **SET — L6 done.** `whatsapp = 8801725196101`, `telegram = +8801725196101` (owner-supplied `+8801725196101`, stored WhatsApp-style without `+` because `main.js` strips non-digits and the CMS field asks for it that way). Written straight to production D1, not through the CMS — the row now reads back on `/api/config/public` | D1 UPDATE (`changes: 1`) + curl, 2026-08-03 22:1x UTC |
| Telegram button caveat | **the stored `telegram` value drives nothing.** `main.js:726` builds `https://t.me/share/url?...`, a generic share sheet that opens the *patient's* Telegram to pick any recipient — it never routes to the doctor. The value is only echoed back into the CMS Settings input (`main.js:1144`). WhatsApp is wired properly (`wa.me/<digits>`, FAB at `main.js:163` + booking button at `:725`) | code read, 2026-08-03 |
| Launch steps L1–L8 | L1 ✅ L2 ✅ L4 ✅ L5 ✅ **L6 ✅ L8 ✅** (re-closed 2026-08-04 — smoke rows deleted, D1 back to 0/0) **L7 ✅** (a `managed_challenge`, not a rate limit — see row above; not an open item) · L3 contingency unused | FIXPLAN marks + probes |
| git | **in sync and clean** — `origin/master` and local `master` both at the latest `git log --oneline -1`; verify with `git ls-remote origin master`, and do not paste a bare hash here, this row is deliberately hash-stable. The Phase-2 work was pushed 2026-08-04 with operator confirmation, which is what first activated the CI gate and the uptime cron. Note the deployed code is live regardless of git: `wrangler pages deploy` uploads the working tree, not a git ref | `git ls-remote` + `git push`, 2026-08-04 |
| Browser clicks | **Whole CMS exercised locally** on the F9 build against local D1/R2 — login, Update Status, **Upload Photo** (R2 + D1 + image served back), Settings save, Gallery delete, Logout. **On production, only the public surface was exercised**; the production CMS was NOT logged into (its PIN and its D1/R2 writes are operator-only) | Playwright, 2026-08-03 |
| Zone-injected scripts | The apex HTML gets **two scripts this repo does not contain**: Cloudflare JavaScript Detections (inline, per-request ray id — a CSP hash can never match it) and the Web Analytics beacon. Both were blocked by F9's first deploy; fixed with a per-request CSP nonce + `static.cloudflareinsights.com`. **Neither appears on `pages.dev`**, so preview testing cannot catch this class of break. (2026-08-04 re-probe: only the JSD inline script appeared in curl fetches — the beacon is request-dependent; CSP allows it either way) | curl + browser, 2026-08-03 |
| **Doc-validity audit** | **Every row of this table re-probed against live state** — apex/www/http redirects, all six security headers, serving deploy + both rollback ids, zero inline handlers, 403 on tokenless booking, digest version/crons/observability/bindings, workers.dev 404, Email Routing (`ready`; recipient verified to the minute; only the disabled catch-all rule), D1 counts (0 appointments, 0 gallery), `/api/config/public`, L7 challenge behavior (`cf-mitigated: challenge`), exposure sweep. **All accurate** except two stale cells, fixed: git hash (`3a2e864`→`4460d34`) and 404 size (1,512→2,589 B). Not re-verifiable read-only: zone rulesets API (wrangler OAuth scope) — L7 was confirmed *behaviorally* instead | curl + wrangler + CF API, 2026-08-04 |
| **UX audit + fixes** | ✅ **DEPLOYED 2026-08-04 as `fb1b3aa8`, verified on the live apex**: a real booking with a live Turnstile token (752-char) → confirmation-only modal + `wa.me` link + `book-` reference, fresh form on reopen; **all four quiz outcomes** land on a valid `#serviceType.selectedIndex` (acne→4, pigmentation→3, hair→9, aging→2); 375px pass with every measured tap target ≥24px and no horizontal overflow; no-JS render proven (all 38 `[data-r]` visible without the gate); **zero CSP violations** — every console message came from `challenges.cloudflare.com`. Original batch of 8 fixes: booking modal shows only the confirmation on success (form + header hidden, restored on reopen; failure path unchanged); **quiz-driven bookings were all server-rejected** — rec names weren't select options; now mapped, plus new `Hair Loss & Scalp Treatments` option; `role=status`/`aria-live` on result regions, `role=dialog` on modals; 17 below-fold images lazy (2.19 MB → ~0.7 MB warm); step dots/faq-send/modal-close/tst-nav tap targets ≥24–44px; no-JS blank page fixed (`html.reveal` gate); Process-heading duplicate and toggle-label copy fixed. Full findings + 11 open recommendations: `docs/audits/UX-AUDIT-2026-08-04.md`. Handoff: `docs/handoffs/HANDOFF-2026-08-04-v2.md` | local click-throughs (puppeteer + system Chrome), 2026-08-04 |

## Active documents

- **`HUMAN-TASKS.md`** — step-by-step guide for everything that needs a person (browser clicks, dashboard launch, owner content, Phase 2 prereqs). **Start here.**
- **`FIXPLAN-2026-08-02.md`** — the execution plan. Phase 1 ✅, **Phase 2 ✅ (F8, F9, F10, F11, F12) — fully closed, nothing outstanding.**
- **`docs/RUNBOOK-BACKUP.md`** — F11. D1 export, verification, and the restore drill. Operator-run.
- `agent.md` — architecture, security rules, deploy/verify checklist.
- `context.md` — domain and medical-content facts; source of truth for credentials and schedules.
- `docs/` — dated archive; see `docs/README.md` for the map. **Latest session log: `docs/handoffs/HANDOFF-2026-08-04-v3.md`** (the two deploys, F10, F11, F12, and the `[hidden]` bug) — read `-v2` before it for the UX audit, `-2026-08-04.md` for L6 and the digest, `-v4` for F9 and `-v3` for F8.
- `docs/prompts/NEXT-PROMPT.md` — **fully spent, history now.** Tasks B and C were
  deployed, F10 shipped, and **Task A (read the digest's first-run logs) was
  closed 2026-08-04**. There is no current kickoff prompt; this file is the truth.
- `docs/prompts/F9-HEADERS-PROMPT.md` — the kickoff prompt for F9. **Done**; kept for the record.

## Standing owner actions

0. ~~Delete the three deploy-verification bookings from production D1~~ **DONE
   2026-08-04**, with hours to spare before the 08-05 digest that would have
   reported the first of them. Re-probed: `SELECT COUNT(*)` → **0 appointments,
   0 gallery**. Standing rule, unchanged: **deploy-verification bookings against
   the live apex are the only way to exercise a genuine Turnstile token, and
   agents are SELECT-only on remote D1** — so any future deploy smoke test leaves
   rows that only the operator can remove. Delete them the same day, and check
   their `appointment_date` against the digest crons before assuming there is
   time.

1. ⚠️ **Rotate the admin PIN.** During F9's browser pass the machine's saved-password
   autofill re-populated the CMS PIN field on `localhost`, so the production PIN
   appeared in an agent session transcript. Nothing was written down and no
   production login was attempted, but transcripts persist — change it in
   CMS Settings (needs the current PIN, min 8 chars). The autofill half of this is
   **fixed 2026-08-05 (F14)**: the PIN fields now carry `autocomplete="new-password"`,
   so browsers no longer offer to save/re-fill them — only the rotation itself
   remains.
2. ~~CMS Settings → real WhatsApp number + Telegram @username~~ **DONE
   2026-08-03** — `+8801725196101` supplied by the owner and written to
   production D1. Booking confirmations and the floating button now reach
   WhatsApp. **Telegram is DEFERRED by the owner (2026-08-03)** — the button
   stays a generic share sheet and the stored value stays unused. Do not treat
   it as a bug; revisit only when the owner supplies a real @username, which
   also needs a code change at `main.js:726`.
3. ~~Open Cloudflare's verification email in `dr.enamtalha@gmail.com`~~ **DONE
   2026-08-03 16:13 UTC.** The digest is fully wired, and its first live run
   (2026-08-04 08:30 UTC / 14:30 Dhaka) **has been read from the logs and was
   green** — see the "Digest first run" row. Dr. Sumya now receives two emails
   per chamber-day, **including on days with no bookings**. Still open, and
   optional: create the `digest@` inbound rule; nothing depends on it.
4. **Confirm chamber schedules** (Alliance Sat–Thu 5–8 PM; DCIMCH Sat–Wed 3–5 PM)
   — F4's enforcement and F8's digest both depend on these.
5. **Leaked token**: delete id `b17d8b1322d3a80ddeebb36d76ae8ba5` — match by the
   **id in the token page URL**, not the name. Turnstile-only scope; low priority.
6. R2 dashboard glance: any `dr-sumya-gallery` object without a D1 row is an orphan.

## If a booking ever 403s in production

Roll back to **`5423d45e`** first, debug after. A Turnstile hostname
misconfiguration rejects every patient silently and looks identical to the
system working. Since F9 there is a second way to produce the same silent
failure: a CSP that blocks `challenges.cloudflare.com` in `script-src` or
`frame-src` stops the widget minting a token, and every booking 403s with no
console error a patient would ever see. **If the symptom appeared right after a
header change, roll back to `f64b9221` (the last pre-F9 deploy) rather than all
the way to `5423d45e`.**

## Before you add markup or build HTML in JS

`script-src` has no `'unsafe-inline'`. An `onclick=` (or any `on*=`) attribute is
dropped silently — no console error, no failed request, no failing test, the
button just does nothing. Use a listener or a `data-` attribute.
`tests/headers.test.mjs` scans `public/` and fails if one reappears.

```bash
npx wrangler pages deployment list --project-name=dr-sumya-pervin-portfolio
```

Then redeploy `5423d45e` from the Pages dashboard.
