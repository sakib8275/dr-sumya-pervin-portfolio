# STATUS.md — Current state (living document)

**The only state document that is kept current.** Update it whenever deployment,
verification, or owner-action state changes. Everything under `docs/` is a dated
snapshot; if this file and a snapshot disagree, this file wins.

**Updated:** 2026-08-03, after the F8 digest build.

---

## The one-line state

**The site is LIVE on `drsumyapervin.com`** (deployment `f64b9221`, 173/173 tests
green; L1–L2, L4–L5, L7 done and verified, smoke booking proven) — remaining work:
operator deletes the smoke row (L8), owner enters WhatsApp/Telegram (L6), one
Upload-Photo browser click; **F8 digest is written and tested but not deployed —
it is blocked on Email Routing (HUMAN-TASKS Task 13), nothing else.**

## Verified right now

| Fact | State | Verified |
|---|---|---|
| Serving deployment | `f64b9221` on apex + pages.dev | `pages deployment list`, 2026-08-03 |
| Rollback target | **`5423d45e`** (last pre-Phase-1 known-good) | same |
| Apex / www / HTTPS | apex 200; www → 301 apex; http → 301 https | curl, 2026-08-03 |
| Tests | **173/173 green** (`npm test`; Miniflare + real compiled worker, plus 16 digest units) | 2026-08-03 |
| F8 digest worker | **code done, `--dry-run` bundles clean, NOT deployed** — `workers/digest/` | `npm test` + `wrangler deploy --dry-run`, 2026-08-03 |
| Email Routing (zone) | **`enabled: false`, status `unconfigured`** — F8's only blocker | Cloudflare API, 2026-08-03 |
| Verified email destinations | **only `nazmus8275@gmail.com`** (operator, verified 2026-04-17); the doctor's inbox is not added | Cloudflare API, 2026-08-03 |
| Booking guard live | tokenless POST on apex → 403; real widget booking succeeded | curl + D1, 2026-08-03 |
| Repo-root exposure | closed — internals all 404 @ 1,512 B | curl, 2026-08-02 |
| SEO/OG | canonical, OG/Twitter, JSON-LD, robots.txt, sitemap.xml, favicon.svg live | curl, 2026-08-02 |
| Production D1 | **1 row = smoke booking `book-09fce136` (notes "test", Confirmed) — DELETE PENDING (L8)**; gallery=0 | D1 SELECT, 2026-08-03 |
| WhatsApp/Telegram | **still EMPTY** — L6 open | `/api/config/public`, 2026-08-03 |
| Launch steps L1–L8 | L1 ✅ L2 ✅ L4 ✅ L5 ✅ L7 ✅ · **L6 ⬜ L8 ⬜** · L3 contingency unused | FIXPLAN marks + probes |
| git | `master` ahead of origin (unpushed docs commits); see latest handoff | 2026-08-03 |
| Browser clicks | Update Status **exercised** (smoke row → Confirmed); **Upload Photo still never clicked** | D1 row state, 2026-08-03 |

## Active documents

- **`HUMAN-TASKS.md`** — step-by-step guide for everything that needs a person (browser clicks, dashboard launch, owner content, Phase 2 prereqs). **Start here.**
- **`FIXPLAN-2026-08-02.md`** — the execution plan. Phase 1 ✅, Phase 0 (dashboard launch) and Phase 2 (hardening) pending.
- `agent.md` — architecture, security rules, deploy/verify checklist.
- `context.md` — domain and medical-content facts; source of truth for credentials and schedules.
- `docs/` — dated archive; see `docs/README.md` for the map. Latest session log: `docs/handoffs/HANDOFF-2026-08-03-v2.md` (F8 built and tested); `HANDOFF-2026-08-03.md` is the domain launch before it.

## Standing owner actions (unchanged)

1. **CMS Settings → real WhatsApp number + Telegram @username** — every booking
   confirmation points nowhere until then.
2. **Digest email address** for Dr. Sumya + **Email Routing setup** (HUMAN-TASKS
   Task 13) — the *only* thing left for F8. The worker is written and tested;
   set `DIGEST_TO` in `workers/digest/wrangler.toml`, deploy, force one cron.
3. **Confirm chamber schedules** (Alliance Sat–Thu 5–8 PM; DCIMCH Sat–Wed 3–5 PM)
   — F4's enforcement and F8's digest both depend on these.
4. **Leaked token**: delete id `b17d8b1322d3a80ddeebb36d76ae8ba5` — match by the
   **id in the token page URL**, not the name. Turnstile-only scope; low priority.
5. R2 dashboard glance: any `dr-sumya-gallery` object without a D1 row is an orphan.

## If a booking ever 403s in production

Roll back to **`5423d45e`** first, debug after. A Turnstile hostname
misconfiguration rejects every patient silently and looks identical to the
system working.

```bash
npx wrangler pages deployment list --project-name=dr-sumya-pervin-portfolio
```

Then redeploy `5423d45e` from the Pages dashboard.
