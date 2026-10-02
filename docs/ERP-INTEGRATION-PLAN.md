# ERP & Patient Portal Integration Plan

**Created:** 2026-10-03 · **Status:** PROPOSED (owner-approved in conversation; nothing built or deployed)
**Owner:** Dr. Sumya Pervin's practice · **Operator:** the owner (solo) · **Build/maintenance:** agents
**Scope:** connect the public website to a clinic ERP/EMR, and later ship a patient-facing app.

This is a **separate programme** from the multi-page rebuild (`docs/CHANGE-REQUEST-2026-10-02.md`,
STATUS.md "Multi-page rebuild programme"). It changes the booking schema, so Phase 1 here is
folded into that programme's Phase 2 booking work rather than run twice.

---

## 1. Locked decisions (owner, 2026-10-03)

1. **System of record:** ERPNext + **Marley Health** (single stack). Not OpenMRS + Ozone, not from-scratch.
2. **Hosting:** self-hosted VPS (owner-operated), ERP origin behind a Cloudflare Tunnel.
3. **Scale:** one doctor now, multi-chamber; design for multi-practitioner later (2027 Centre).
4. **Booking direction:** the site takes the booking and the ERP receives it. **No real-time
   availability feed in v1.**
5. **Patient app:** **PWA-first** (agent-built). v1 = journey timeline + digital prescription +
   medicine reminders. Chat and articles are later phases.
6. **Chat:** real-time transport, but asynchronous-by-design and **no guaranteed response SLA**.
7. **Prescription:** a digitally-signed **clinical record + verification QR**, labelled "patient
   copy" — *not* the legally-binding e-prescription (see §9).
8. **Data:** fresh launch; **no historical migration**.
9. **Non-negotiables:** fast, secure, per-patient journey isolation.

---

## 2. Why ERPNext + Marley Health

| Option | Verdict |
|---|---|
| **OpenMRS + ERPNext via Ozone** | Rejected. Ozone HIS is a hospital/HIE-scale interoperability platform (Docker/K8s, multiple servers + middleware). A solo operator cannot run it responsibly for one practice. |
| **OpenMRS alone** | Rejected. EMR only — no billing/inventory/accounting. Needs a partner to run. |
| **From scratch on Cloudflare** | Rejected for "full-fledged". Would mean reimplementing billing, inventory, accounting and clinical records. |
| **ERPNext + Marley Health** | **Chosen.** One stack, one MariaDB, one backup, one operator. Covers patient records, appointments, encounters, prescriptions, lab, billing, inventory, accounting, HR. ERPNext's former Healthcare module was spun out into the separate **Marley Health** Frappe app (Earthians), installed alongside ERPNext. |

OpenMRS stays a *future* option only if formal FHIR/HIE interop or multi-facility exchange is ever
needed. The adapter seam (§4) keeps the site vendor-agnostic so that stays a swap, not a rewrite.

---

## 3. Architecture

```
Patient ──HTTPS──> CF Pages (site + CMS + D1)        ← public, CDN-fast, never blocked by ERP
                        │  writes the booking locally, returns instantly
                        ▼
                   D1 erp_outbox ──cron──> workers/erp-sync ──HTTPS──> ERPNext + Marley Health
                                                 (token auth, idempotent, retry, DLQ)   │ origin behind
                                                                                         │ CF Tunnel
                   CMS  <── D1  <── /api/erp/webhook (HMAC)  <────────────────────────────┘

Patient PWA ──patient JWT──> BFF (CF Workers / Durable Objects) ──service token──> ERPNext
                                 │  per-patient authorization on EVERY read
                                 └─ D1: sessions, reminders, outbox, audit
```

**Rules**
- The website and the PWA **never hold ERP credentials**. Only `workers/erp-sync` and the BFF do.
- The BFF is the **authorization boundary**: ERPNext's portal permissions are Customer-based and are
  *not* patient-scoped out of the box, so "patient A may only read patient A" is enforced in the BFF.
- The public booking path is **ERP-independent** (outbox), so ERP downtime never blocks a patient.

---

## 4. Phases

### Phase 0 — ERP foundation (owner, blocking)
Stand up ERPNext + Marley Health on the VPS (§8). Configure Company, Healthcare Practitioner,
Service Units (2 chambers), Appointment Types (Specialist / Comprehensive / Signature / Procedure
Assessment), and the Item + Price List catalogue mapped from docx Part 6. Enable 2FA on every user,
create a least-privilege integration user, nightly encrypted backups to R2, **one rehearsed restore**.
Record the environment (host, site name, versions) in `agent.md`.

### Phase 1 — D1 schema seam (folded into booking Phase 2)
`appointments` gains `external_ref UNIQUE` (idempotency key = `book-xxxx`), `erp_patient_id`,
`erp_appointment_id`, `sync_status`, `sync_attempts`, `last_error`. New tables `erp_outbox`
(outbound queue) and `erp_events` (inbound dedupe). One migration, not two.

### Phase 2 — `workers/erp-sync/` (outbound)
On a new booking: upsert `Patient` (match on phone) → create `Patient Appointment` → write the ERP
ids back to D1. Idempotent, exponential backoff, dead-letter after N attempts, structured
`loggedWrite` with **no clinical fields**. Sync health surfaced in the CMS, never silent.

### Phase 3 — Inbound
`/api/erp/webhook` (HMAC-verified) for status/triage changes → D1 → CMS list. Contact form →
ERPNext `Lead`.

### Phase 4 — BFF + patient accounts
Phone-OTP auth (Bangladesh numbers); **no self-registration without clinic verification**; short-lived
JWT + refresh; per-patient scoping enforced server-side; device revocation; audit table.

### Phase 5 — Portal v1 (PWA): journey + prescription + reminders
Journey timeline aggregated from the ERP; digital prescription (structured + signed PDF); reminders
derived from the prescription (on-device local notifications where possible, opaque server push
otherwise). Optional Phase 5.5: thin native wrapper if iOS web-notification limits bite.

### Phase 6 — Real-time chat
Durable Object per patient thread; WebSocket transport; every message written through to the ERP
(`Communication` or a custom `Patient Message` doctype) so it is part of the medical record.
Guardrails per §10.

### Phase 7 — Articles
Doctor-authored/reviewed, tagged by condition, "educational, not personal advice" disclaimer.

---

## 5. ERPNext doctype mapping

> **Verify exact doctype and field names against the installed Marley Health version before coding.**
> Marley Health's schema can differ from upstream ERPNext docs.

| Need | DocType |
|---|---|
| Patient | `Patient` (phone unique) |
| Booking | `Patient Appointment` |
| Visit | `Patient Encounter` |
| Medications | prescription child table on `Patient Encounter` |
| Billing | `Sales Invoice` |
| Catalogue | `Item` / `Item Price` / `Price List` |
| Chambers | `Healthcare Service Unit` |
| Doctor | `Healthcare Practitioner` |
| Chat | `Communication` or custom `Patient Message` |
| Enquiry | `Lead` |

---

## 6. BFF endpoints (Phase 4+)

**Auth:** `POST /api/portal/auth/otp/request`, `POST /api/portal/auth/otp/verify`,
`POST /api/portal/auth/refresh`, `POST /api/portal/auth/logout`.

**Data (all patient-scoped):** `GET /api/portal/me`, `/journey`, `/prescriptions`,
`/prescriptions/:id`, `/articles`; `POST /reminders/sync`; `WS /api/portal/chat` (Phase 6).

**Ops:** `/api/erp/webhook` (HMAC), internal health + reconcile.

---

## 7. D1 schema seam

```sql
ALTER TABLE appointments ADD COLUMN external_ref   TEXT;      -- idempotency key (book-xxxx), UNIQUE index
ALTER TABLE appointments ADD COLUMN erp_patient_id TEXT;
ALTER TABLE appointments ADD COLUMN erp_appointment_id TEXT;
ALTER TABLE appointments ADD COLUMN sync_status    TEXT DEFAULT 'pending'; -- pending|synced|failed
ALTER TABLE appointments ADD COLUMN sync_attempts  INTEGER DEFAULT 0;
ALTER TABLE appointments ADD COLUMN last_error     TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS erp_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,                 -- 'appointment.create'
  ref  TEXT NOT NULL,                 -- appointments.id
  payload TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  next_attempt_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS erp_events (
  event_id TEXT PRIMARY KEY,          -- ERP webhook id, for dedupe
  received_at TEXT DEFAULT (datetime('now'))
);
```

---

## 8. Self-hosted VPS build spec

- **Box:** Ubuntu 24.04 LTS, **4 vCPU / 8 GB RAM / 80 GB SSD** (4 GB is the floor, not the target).
  Region: **Singapore** unless a trusted in-country option exists.
- **Stack:** MariaDB 10.6+, Redis, Node 20, Python 3.10+ — via Frappe's `bench` (native install is
  the supported path and simplest to upgrade with `bench update`). `frappe_docker` is the alternative.
- **Exposure:** nginx bound locally; **`cloudflared` Tunnel** makes an outbound connection, so the
  VPS opens **no inbound 80/443** — SSH only.
- **Hardening:** SSH keys only (no root password), UFW (SSH only), fail2ban, unattended-upgrades,
  2FA on all ERPNext users, least-privilege integration user, API-token rotation.
- **Backups:** nightly `bench backup --with-files` → encrypted dump to R2, periodic VPS snapshots,
  and **one rehearsed restore before go-live**.
- **Monitoring:** reuse the existing `workers/probe` pattern to poll the ERP health endpoint and email
  on down/recovery, same as the site probe.

---

## 9. Prescription decision (owner delegated)

Ship the digital prescription as a **digitally-signed clinical record + verification QR**, labelled
**"patient copy — the clinic's signed prescription is the legal document."**

Rationale: Bangladesh has no settled e-prescription legal framework, so claiming binding status
creates exposure with no enabling law. Design it **binding-ready** — BMDC registration number, doctor
crypto signature, QR verification, immutable snapshot — so it can be flipped to binding later without
a redesign. **Caveat:** a short legal review of current BMDC guidance is required before launch.

---

## 10. Chat policy (owner delegated)

Real-time transport, but **no guaranteed response window**. The app states: *"Replies during clinic
hours only. Not for emergencies — call the chamber. For urgent concerns, book an appointment."*
Plus an auto-reply when the clinic is closed. Chat messages are part of the medical record (written
through to the ERP), are asynchronous-only, and must not become diagnosis-by-chat — escalate to an
appointment. A guaranteed SLA is a business decision the owner must make explicitly; absent a reason,
promise nothing.

---

## 11. Testing strategy

- **Unit:** outbox idempotency, retry/dead-letter, HMAC verification, OTP, and `erp-sync` mapping
  against a **mock ERPNext** (no live ERP in CI).
- **Security-critical:** patient-A-cannot-read-patient-B authorization tests on every BFF route.
- **E2E:** booking → outbox → mock ERP → `sync_status=synced`; webhook → CMS.

---

## 12. Risks & open items

| Risk / open item | Mitigation / next step |
|---|---|
| Solo-operator ops burden (MariaDB/Redis/Node upgrades, backups) | Follow the §8 runbook; nightly backups + rehearsed restore; consider managed Frappe Cloud if burden proves too high |
| ERPNext upgrade drift | Pin versions; keep all ERP specifics inside `workers/erp-sync` and the BFF |
| Real-time chat = medical record + liability | §10 guardrails; defer to Phase 6 |
| iOS PWA reminder reliability | Opaque server push + local schedule; optional native wrapper (Phase 5.5) |
| Prescription legal status | §9 — legal review of BMDC guidance before launch |
| Patient portal is a larger product than the website | Keep it a separate repo/roadmap; phases 4–7 |
| Marley Health doctype/field drift | Verify names at build time (§5) |

---

## 13. Governance

- Deploys remain **owner-gated**, as with the website programme.
- Phase 0 is the owner's to provision; agents prepare runbooks, config and verification steps.
- No clinical data crosses the website seam: the site keeps booking fields only; the ERP is the sole
  home of clinical records.
