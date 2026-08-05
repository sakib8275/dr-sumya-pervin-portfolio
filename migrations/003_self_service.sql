-- Self-service CMS: password reset, TOTP 2FA, and site-content editing.
--
-- Applied 2026-08-05 as part of the self-service CMS build. See
-- docs/handoffs/HANDOFF-2026-08-05-self-service-cms.md.
--
-- admin_settings gains an email (reset destination) and the TOTP secret. The
-- secret is stored before enrollment and only activated when totp_enabled flips
-- to 1 after the first code verifies. An email password reset clears both, so a
-- lost authenticator is recoverable through the verified inbox.

ALTER TABLE admin_settings ADD COLUMN admin_email TEXT DEFAULT '';
ALTER TABLE admin_settings ADD COLUMN totp_secret TEXT DEFAULT '';
ALTER TABLE admin_settings ADD COLUMN totp_enabled INTEGER DEFAULT 0;

-- Password reset tokens. Only the SHA-256 hash of the token is stored; the
-- plaintext token exists only in the emailed link. Single-use (used_at) and
-- expiring (expires_at). A new request reuses the table for throttling.
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used_at TEXT
);

-- TOTP login challenges: a short-lived record that counts wrong-code attempts
-- so a brute-forced 6-digit code is impossible. Deleted on success or on the
-- 5th failed attempt.
CREATE TABLE IF NOT EXISTS twofa_challenges (
  challenge_id TEXT PRIMARY KEY,
  attempts INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Editable site copy. Rows are never seeded: the hardcoded text in index.html
-- is the default until the admin saves something, so the page renders even when
-- this table is empty or the API is down. Scalar keys hold text; 'chambers' and
-- 'services' hold JSON arrays.
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);
