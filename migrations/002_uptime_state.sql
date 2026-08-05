-- F11 — probe state for the Cloudflare-native uptime monitor (workers/probe).
--
-- A single row (id = 1) holding how many consecutive probes have failed, so the
-- Worker can mail the doctor once when an outage STARTS and once when it
-- RECOVERS, instead of every 30 minutes. Applied to production D1 with:
--   npx wrangler d1 execute dr-sumya-pervin-db --remote --file migrations/002_uptime_state.sql
--
-- Nothing patient-identifying: just counters and timestamps. This table is
-- excluded from the backup runbook's EXPECTED_TABLES on purpose — it is
-- operational state, not data the doctor depends on.

CREATE TABLE IF NOT EXISTS uptime_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_check TEXT DEFAULT '',
  last_ok_at TEXT DEFAULT '',
  last_fail_at TEXT DEFAULT ''
);
