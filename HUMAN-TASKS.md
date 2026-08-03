# HUMAN-TASKS.md — Everything that needs a person, step by step

No code changes here. Each task says **who** can do it, **how long**, the exact
clicks/commands, how to **verify it worked**, and what to do **if it goes wrong**.
Do them in order — later tasks assume earlier ones are done.

**Who you need:**
- 🖥️ **Dashboard person** — anyone with the Cloudflare login (account `344944ed…`).
- 👩‍⚕️ **Practice owner** — for PIN, contact numbers, content decisions.

**Total active time:** ~1 hour, plus certificate waiting time in Task 2.

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

## Task 6 — Enter the real contact numbers (5 min · 👩‍⚕️)

**Why:** today every booking confirmation links to nothing — the database fields are
verified empty.

1. Open the CMS → **Settings** tab.
2. **Doctor's WhatsApp Number:** digits only, with country code — e.g. `8801XXXXXXXXX`
   (no `+`, spaces, or dashes; the site builds `wa.me/<digits>` from it).
3. **Telegram Username / Channel:** the `@username` — **not** a numeric user ID
   (`t.me/<numbers>` does not resolve).
4. Save.

**Verify:** `curl -sS https://drsumyapervin.com/api/config/public` → both fields
non-empty. The floating WhatsApp button appears on the site; a booking confirmation
now shows a WhatsApp button with a real `wa.me` link.

---

## Task 7 — Rate-limit the login endpoint (10 min · 🖥️)

1. Zone → **Security** → **WAF** → **Rate limiting rules** → create.
2. Match: **URI Path** equals `/api/auth/login` **and Method** equals `POST`.
3. **5 requests per 1 minute**, keyed by **IP**, action **Managed Challenge**
   (not Block — protects the doctor from locking herself out on a mistyped PIN).
4. Deploy.

**Verify:** from one machine, POST the login 6+ times quickly with a wrong PIN —
the 6th should get a challenge/429-style page; then one real login through the CMS
must still succeed.

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

1. **Digest email address** — which email should receive the daily booking lists?
   Needed before the digest worker (F8) can be built. Tell the agent.
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

## Task 13 — Email prerequisites for the daily digest (15 min · 🖥️ · Phase 2)

**This is now the only thing between the digest and working.** The worker is
written, tested (16 tests) and bundles clean — it just has nowhere to send.

Checked live on 2026-08-03: Email Routing on `drsumyapervin.com` is **not
enabled** (status `unconfigured`), and the only verified destination on the whole
account is **`nazmus8275@gmail.com`** — the operator's address, not the doctor's.

1. Zone → **Email** → **Email Routing** → **Get started** (creates MX records).
2. Add the **destination address** (the doctor's real inbox) and verify it via
   the confirmation email Cloudflare sends there. Cloudflare will not deliver to
   an unverified address, so this step cannot be skipped or faked.
   *Interim option:* `nazmus8275@gmail.com` is already verified, so the operator
   can receive the digest from day one and switch it to the doctor later. Note
   the mail contains patient names, phone numbers and notes — decide deliberately.
3. Create the sender address **`digest@drsumyapervin.com`**.
4. Put the destination in `workers/digest/wrangler.toml` → `DIGEST_TO`, then
   deploy and force one cron run to prove an email arrives:

   ```bash
   cd workers/digest && npx wrangler deploy
   # then: Workers dashboard → dr-sumya-digest → Settings → Trigger Events →
   # "Test scheduled event" (pick either cron), and check the inbox.
   ```

   With `DIGEST_TO` blank the worker is safe but inert: at each cutoff it logs
   `digest: DIGEST_FROM/DIGEST_TO not configured` and sends nothing.

---

## Done = launch complete

When Tasks 1–8 are verified, the site is **live and trustworthy**:
`https://drsumyapervin.com` serves the final build, bookings reach the doctor's
system with working contact links, and the login is rate-limited. Tasks 10–13
finish the practice-content and Phase-2 work at whatever pace suits the owner.

*Update `STATUS.md` as tasks complete — it's the living record; this guide is the how.*
