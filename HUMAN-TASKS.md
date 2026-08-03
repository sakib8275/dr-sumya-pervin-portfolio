# HUMAN-TASKS.md — Everything that needs a person, step by step

No code changes here. Each task says **who** can do it, **how long**, the exact
clicks/commands, how to **verify it worked**, and what to do **if it goes wrong**.
Do them in order — later tasks assume earlier ones are done.

**Who you need:**
- 🖥️ **Dashboard person** — anyone with the Cloudflare login (account `344944ed…`).
- 👩‍⚕️ **Practice owner** — for PIN, contact numbers, content decisions.

**Total active time:** ~1 hour, plus certificate waiting time in Task 2.

---

## Task 0 — ⚠️ Rotate the admin PIN (5 min · 👩‍⚕️ · do this soon)

**Why:** during the 2026-08-03 browser testing, the machine's saved-password
autofill re-populated the CMS PIN field on `localhost`, so **the production PIN
appeared in an agent session transcript**. It was never written to a file, never
used against production, and is recorded nowhere in this repo — but transcripts
persist, so treat it as disclosed.

1. Open the CMS → **Settings** tab.
2. Enter the **current** PIN, then the new one (**minimum 8 characters**).
3. Save, log out, and log back in with the new PIN to confirm it took.

**Related, smaller:** the PIN field has no `autocomplete="new-password"`, which is
why browsers offer to save and re-fill it. That is a code fix for an agent, not
something you can click.

---

## Task 1 — Click the two CMS flows (10 min · 🖥️ or 👩‍⚕️ · browser)

**Why:** the automated tests *read* the CMS code but no human has ever clicked these
two repaired flows against the live site. Everything else is verified.

1. Open **https://dr-sumya-pervin-portfolio.pages.dev** in a normal browser.
2. First make a test appointment to work with: click **Book Appointment**, fill the
   form (choose a date that is **not** today after 4:30 PM and **not** Friday — the
   new schedule rules reject those), solve the checkmark, submit. Expect green
   *"Appointment Request Submitted"* with a `book-xxxxxxxx` reference.
3. Open the **CMS admin panel**, solve the checkmark, log in with the PIN.
4. **Appointments tab** → find your test booking → click **Update Status**.
   - Expect: Pending → **Confirmed**. Reload the page → it must still say Confirmed.
   - Click again → **Completed**.
5. **Upload Photo tab** → enter a title, pick a category, **choose an image file
   from your computer** → **Publish**.
   - Expect: success alert, and the photo on the public page (Results/Gallery
     section) is **the file you chose** — not a stock clinic image.
6. Clean up: delete the test photo (Gallery Items tab) and the test appointment
   (Appointments tab → Delete).

**If it fails:** note the exact alert/message and stop — report it, don't retry
blindly. A 403 on step 2 means Task 3's hostname step is broken (see Task 9).

---

## Task 2 — Attach `drsumyapervin.com` to the site (10 min + wait · 🖥️)

1. Cloudflare dashboard → **Websites** → confirm `drsumyapervin.com` is listed in
   **this** account. (If it sits under another Cloudflare login, stop and tell the
   agent — the flow changes.)
2. **Workers & Pages** → `dr-sumya-pervin-portfolio` → **Custom domains** →
   **Set up a domain** → enter `drsumyapervin.com` → confirm.
3. Wait for the certificate status to show **Active** (usually minutes, up to hours).

**Verify:** from a terminal —
```
curl -sS -o /dev/null -w '%{http_code} %{size_download}\n' https://drsumyapervin.com/
```
Expect `200` and roughly `38659` bytes. Open it in a browser: the site looks
identical to the pages.dev address.

**If it goes wrong:** "certificate pending" for over an hour → check the zone's DNS
page shows a record Cloudflare created for the domain; if none, remove the custom
domain and re-add it.

---

## Task 3 — Allow the live domain in the Turnstile widget (5 min · 🖥️)

**⚠️ The highest-risk step of the launch.** If this is missed, every patient booking
fails with a silent 403 that looks exactly like the site working.

1. Dashboard → **Turnstile** (left sidebar) → find the widget whose sitekey is
   **`0x4AAAAAAEClxf8-TRYoLcZl`** (that's the one embedded in the site).
2. Edit it → **Hostnames** → add **`drsumyapervin.com`** (apex only — www will
   redirect, Task 4). Save.
3. Do **not** remove `dr-sumya-pervin-portfolio.pages.dev` — it is still needed.

**Verify:** this is proven only by a real booking — that's Task 8. Do not mark done
until Task 8 passes.

---

## Task 4 — Redirect www to the apex (5 min · 🖥️)

1. Dashboard → zone `drsumyapervin.com` → **Rules** → **Redirect Rules** → create.
2. Pattern: **hostname equals `www.drsumyapervin.com`** →
   **Static** target `https://drsumyapervin.com/` → **301**, preserve query string. Deploy.

**Verify:** `curl -sSI https://www.drsumyapervin.com/` → `301` with
`location: https://drsumyapervin.com/`. (www won't resolve at all until the rule or a
DNS record exists — if curl says "could not resolve", wait a minute and retry, or add
the redirect's DNS record if the dashboard asks.)

---

## Task 5 — Force HTTPS (5 min · 🖥️)

1. Zone → **SSL/TLS** → **Overview** → set **Full (strict)**.
2. **SSL/TLS → Edge Certificates** → enable **Always Use HTTPS**.

**Verify:** `curl -sSI http://drsumyapervin.com/` → `301` to the `https://` URL.

---

## Task 6 — Enter the real contact numbers ✅ **DONE 2026-08-03**

The owner supplied `+8801725196101`. It was written **straight to production D1**
(the CMS route needs the PIN, which is operator-only) and reads back on
`/api/config/public`: `whatsapp = 8801725196101` — stored without the `+`,
because the site builds `wa.me/<digits>` and strips non-digits anyway. The
floating WhatsApp button and the booking-confirmation forward button are live.

**Telegram is deferred by the owner, and nothing is broken by that.** The stored
`telegram` value **drives nothing today**: the site's Telegram button builds
`https://t.me/share/url?...`, a generic share sheet that opens the *patient's*
Telegram so they can pick any recipient — it never routes to the doctor. Giving
it a real `@username` would not change that on its own; it needs a code change at
`public/js/main.js:726`. Do not file this as a bug.

**If the number ever changes:** the CMS → **Settings** tab is the normal route
(digits only, country code, no `+`/spaces/dashes). Verify with
`curl -sS https://drsumyapervin.com/api/config/public`.

---

## Task 7 — Protect the login endpoint ⚠️ **do not follow the old steps**

**This task's original instructions were wrong about what exists.** A 2026-08-03
read of the zone's rulesets found:

- The rule on `POST /api/auth/login` is a **`managed_challenge`, not a rate
  limit.** It challenges attempts; it does not count or cap them.
- The zone's *one* rate-limiting rule is **`Leaked credential check`** (block,
  5 per 10 s). **The Free plan allows exactly one such rule**, and it is
  deliberately spent on that — so you cannot simply add the login one.

So there is **nothing to click here**, and the login is *not* rate-limited today.
The real fix is application-level throttling inside
`functions/api/auth/login.js` (D1- or KV-backed, keyed on the attempt). That is
agent work, is not yet in the FIXPLAN, and should be proposed before it is built.

**Do not mark this task done and do not treat the challenge as a rate limit.**

---

## Task 8 — The launch smoke test (15 min · 🖥️ + 👩‍⚕️)

**This is the only proof the whole chain works on the live domain.**

1. In a **normal browser, not logged in**, open **https://drsumyapervin.com**.
2. Book an appointment like a patient: real-looking name/phone, an allowed chamber
   and date (not today after cutoff, not a closed day), solve the checkmark, submit.
3. **Expect:** green success box with a `book-xxxxxxxx` reference, and the WhatsApp
   forward button carrying a real `wa.me/<doctor's number>` link.
4. **Then delete the smoke row.** An operator runs (agents can't write remote D1):
   ```
   npx wrangler d1 execute dr-sumya-pervin-db --remote --command "DELETE FROM appointments WHERE id = 'book-xxxxxxxx'"
   ```
   (substitute the real reference).

**If the booking 403s:** go straight to Task 9 — do not debug on live patients.

---

## Task 9 — Rollback, only if something 403s (5 min · 🖥️)

1. Dashboard → **Workers & Pages** → `dr-sumya-pervin-portfolio` → **Deployments**.
2. Find **`5423d45e`** (the pre-launch known-good) → **Roll back** to it.
3. Confirm bookings work again on the pages.dev URL.
4. Tell the agent what happened — the fix is almost always Task 3's hostname list,
   and it is safe to redo while the rollback serves.

---

## Task 10 — Owner content decisions (when convenient · 👩‍⚕️)

1. ~~**Digest email address**~~ — **answered**: `dr.enamtalha@gmail.com`, live and
   verified (Task 13).
2. **Confirm the printed schedules** — Alliance Sat–Thu 5–8 PM, DCIMCH Sat–Wed
   3–5 PM. The booking form now *enforces* these; if a day or time is wrong, say so
   before patients hit it.
3. **Real gallery photos** — the gallery is empty; upload real ones via CMS
   (Task 1 step 5 proves it works).
4. **Contact form, yes or no** — the backend exists but no page uses it. Decide.

---

## Task 11 — Delete the leaked API token (5 min · 🖥️ · low priority)

1. Dashboard → **Manage Account → Account API Tokens**.
2. **Match by the id in the token's page URL**, not by name:
   **`b17d8b1322d3a80ddeebb36d76ae8ba5`**. (Two wrong name-based identifications
   happened already; background in `docs/handoffs/HANDOFF-2026-07-31-v4.md`.)
3. Delete it. Deleting breaks nothing — the widget and site don't use this token.
4. Tell the agent; the commented line in `~/.bashrc` can then be removed.
5. If no token carries that id, it belongs to a different Cloudflare login and
   cannot be revoked from here — that's the end of it.

---

## Task 12 — One glance at the photo bucket (2 min · 🖥️)

1. Dashboard → **R2** → `dr-sumya-gallery` → **Objects**.
2. The database has **zero** gallery rows right now, so **any object present is an
   orphan** and can be deleted in place. (After Task 1, if you deleted the test
   photo through the CMS, its object was deleted with it.)

---

## Task 13 — Email prerequisites for the daily digest ✅ **DONE 2026-08-03**

All of it is done: Email Routing enabled on the zone (status `ready`; MX + SPF +
DKIM created automatically), `dr.enamtalha@gmail.com` added as the destination
and **`verified` at 16:13 UTC** (the owner clicked the link), `DIGEST_TO` set,
the worker deployed with both crons registered, and Workers Logs turned on.

**Nothing blocks the digest.** Its first scheduled run is **2026-08-04 08:30 UTC
(14:30 Dhaka)** — no cron had fired before then, because the deploy landed at
15:10 UTC, after both of that day's cron times.

### ⚠️ What "it worked" will look like — read this before you conclude it failed

Production D1 currently holds **zero appointments**. A correct run with nothing
to report **sends no email at all**. So an empty inbox tomorrow afternoon is the
*expected* result and is not evidence of a problem.

That ambiguity is exactly why Workers Logs were enabled first. **Judge the run
from the logs, not the inbox** — an agent can read them
(`dr-sumya-digest` → Observability, or the Cloudflare observability MCP) and tell
you which of four things happened: never fired / sent successfully / fired and
correctly had nothing to send / fired and the send failed.

### Still open (small, optional)

Create the inbound `digest@drsumyapervin.com` routing rule, which Cloudflare
rejected while the destination was unverified (`2054`). **Nothing depends on
it** — the worker sends mail, it does not receive any. It is only so bounces and
replies to the digest land somewhere.

If you ever want to force a run rather than wait: Workers dashboard →
**dr-sumya-digest** → **Settings** → **Trigger Events** → *Test scheduled event*.
Or locally:

```bash
cd workers/digest && npx wrangler dev --remote --test-scheduled --port 8799
curl "http://localhost:8799/__scheduled?cron=30+10+*+*+SUN-THU,SAT"
```

⚠️ That sends a **real** email listing the day's real bookings.

If the recipient should be someone other than `dr.enamtalha@gmail.com`, change
`DIGEST_TO` in `workers/digest/wrangler.toml` and redeploy — the new address must
be added and verified in Email Routing too. The digest contains patient names,
phone numbers and notes, so that address is a deliberate choice.

---

## Done = launch complete

Tasks 1–6, 8 and 13 are verified: `https://drsumyapervin.com` serves the final
build, bookings reach the doctor's system with a working WhatsApp link, and the
daily digest is wired end to end. **Task 7 is the exception** — the login carries
a managed challenge but is *not* rate-limited, and that fix is code, not clicks.
Task 0 (PIN rotation) and Task 10 (content) are the owner's remaining work.

*Update `STATUS.md` as tasks complete — it's the living record; this guide is the how.*
