# RUNBOOK — D1 backup and restore (F11)

**What this protects:** `dr-sumya-pervin-db` holds every patient appointment, the
gallery index, and the admin settings row (including the PIN hash). There is no
other copy. A bad `DELETE` or a dropped table is unrecoverable without an export
taken beforehand — Cloudflare's own point-in-time recovery is not on this plan.

**Who runs it:** the **operator**. Agents are SELECT-only against remote D1;
`wrangler d1 export` is a read, but it writes a file containing patient names and
phone numbers, so it is a deliberate human act, not something to automate onto a
shared runner.

**How often:** weekly, and **always immediately before** any migration or any
manual `DELETE`/`UPDATE` against `--remote`.

---

## Take a backup

```bash
cd "/home/kitahara-poposagain/Desktop/Portfolio Sumya Pervin"
npm run backup:d1
```

That wraps:

```bash
npx wrangler d1 export dr-sumya-pervin-db --remote \
  --output "backups/d1-$(date -u +%Y%m%dT%H%M%SZ).sql"
```

**Verify the export is real, not an empty file:**

```bash
ls -lh backups/                       # newest file should be > 1 KB
grep -c 'INSERT INTO' backups/<file>  # should match your row count
grep -c 'CREATE TABLE' backups/<file> # 4: appointments, gallery, admin_settings, contact_messages
```

> ⚠️ **A 0-row export is a plausible correct result.** Production D1 is often
> empty (0 appointments as of 2026-08-04). `CREATE TABLE` statements with no
> `INSERT`s is a healthy backup of an empty database, not a failed export.
> Check the `CREATE TABLE` count before concluding anything went wrong.

### Where the file goes

`backups/` is **gitignored**, and must stay that way — an export is a plaintext
file of patient names, phone numbers, medical notes and the admin PIN hash.
Committing one would publish everything this repo spent three audits keeping out
of `public/`. Move it somewhere private and encrypted, then delete the local
copy.

---

## Restore into local D1 (the drill)

Restoring is the half of a backup people discover is broken at the worst moment.
Do this at least once so the procedure is known-good:

```bash
# 1. Reset the local database and apply the schema.
rm -rf .wrangler/state/v3/d1
npx wrangler d1 execute dr-sumya-pervin-db --local --file=migrations/001_schema.sql

# 2. Replay the export.
npx wrangler d1 execute dr-sumya-pervin-db --local --file=backups/<file>.sql

# 3. Prove it landed.
npx wrangler d1 execute dr-sumya-pervin-db --local \
  --command "SELECT COUNT(*) AS appointments FROM appointments"
npm run dev    # then open the CMS and look at the Appointments tab
```

## Restoring to PRODUCTION

**Stop and think first.** A restore overwrites live patient data with a snapshot,
and any booking taken since the export is lost. Take a fresh export *before*
restoring, even from a broken database — it is the only record of what the
current state was.

```bash
# Operator-run, after taking a fresh export of the current (broken) state.
npx wrangler d1 execute dr-sumya-pervin-db --remote --file=backups/<file>.sql
```

The export contains `CREATE TABLE` statements, so replaying it into a database
that still has its tables fails on the first statement. Either restore into an
empty database or strip the DDL first — decide which deliberately.

---

## What a backup does NOT cover

- **R2 (`dr-sumya-gallery`)** — the gallery *images*. D1 holds only the rows that
  point at them. A D1 restore against an emptied bucket gives you a gallery of
  broken images. `wrangler` v4 cannot list bucket objects; use the dashboard.
- **Secrets** — `JWT_SECRET`, `SITE_SECRET`, `TURNSTILE_SECRET` live in Pages,
  not D1, and are not exported. They are also not recoverable from Cloudflare;
  losing them means rotating them.
- **The admin PIN** — the export carries its *hash*, so a restore restores
  whatever PIN was current at export time. If the PIN was rotated since, the old
  one comes back with the restore.
