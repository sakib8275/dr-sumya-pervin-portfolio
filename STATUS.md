# STATUS.md — Current state (living document)

**The only state document that is kept current.** Update it whenever deployment,
verification, or owner-action state changes. Everything under `docs/` is a dated
snapshot; if this file and a snapshot disagree, this file wins.

**Updated:** 2026-08-02, after the Phase 1 deploy.

---

## The one-line state

**Phase 1 is shipped and verified on pages.dev (deployment `f64b9221`, source
`d0c4896`, 148/148 tests green) — the remaining launch work is dashboard steps
(L1–L8) and owner data entry, not code.**

## Verified right now

| Fact | State | Verified |
|---|---|---|
| Serving deployment | `f64b9221` (was `5423d45e` pre-Phase-1) | `pages deployment list`, 2026-08-02 |
| Rollback target | **`5423d45e`** (last pre-Phase-1 known-good) | same |
| Tests | **148/148 green** (`npm test`, Miniflare, real compiled worker) | 2026-08-02 |
| Booking guard live | tokenless POST → 403; Turnstile intact | curl, 2026-08-02 |
| Repo-root exposure | closed — internals all 404 @ 1,512 B | curl, 2026-08-02 |
| SEO/OG | canonical, OG/Twitter, JSON-LD, robots.txt, sitemap.xml, favicon.svg live | curl, 2026-08-02 |
| Production D1 | `appointments=0, gallery=0, contact_messages=0`; **whatsapp/telegram still EMPTY** | D1 SELECT, 2026-08-02 |
| Custom domain | **NOT attached** — apex has 0 DNS answers, www NXDOMAIN | DNS, 2026-08-02 |
| git | `master` pushed, == `origin/master` (`70a53ff`) | 2026-08-02 |
| Browser clicks | CMS Update-Status cycle + Upload Photo still never clicked by a human | OPEN |

## Active documents

- **`FIXPLAN-2026-08-02.md`** — the execution plan. Phase 1 ✅, Phase 0 (dashboard launch) and Phase 2 (hardening) pending.
- `agent.md` — architecture, security rules, deploy/verify checklist.
- `context.md` — domain and medical-content facts; source of truth for credentials and schedules.
- `docs/` — dated archive; see `docs/README.md` for the map.

## Standing owner actions (unchanged)

1. **CMS Settings → real WhatsApp number + Telegram @username** — every booking
   confirmation points nowhere until then.
2. **Digest email address** for Dr. Sumya — gates F8 (daily per-chamber digest).
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
