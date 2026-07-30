CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  whatsapp TEXT DEFAULT '',
  telegram TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  chamber TEXT NOT NULL,
  appointment_date TEXT NOT NULL,
  service TEXT NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'Pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  caption TEXT DEFAULT '',
  image_path TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  message TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- PBKDF2-SHA256, 100k iterations, per-install salt.
--
-- These are live seed values, generated 2026-07-30 with `npm run seed-pin` and
-- held by the operator who ran it. The hash and salt are not secret — they are
-- meant to live here — but the plaintext PIN exists only outside this repo, by
-- design. It is not recoverable from these values.
--
-- To rotate: prefer the CMS Settings panel, which requires the current PIN and
-- generates a fresh salt. To reseed from scratch, run `npm run seed-pin` again
-- and replace both literals below. That script reads the PIN with terminal echo
-- off and prints only the salt and hash, so the plaintext never reaches a
-- transcript, a log, or a tracked file; it derives the hash by importing
-- hashPin from functions/lib/auth.js, so the seed cannot drift from what the
-- login endpoint verifies.
--
-- History, because it constrains how this slot should be handled: it previously
-- held a valid hash whose plaintext was generated inside an agent session and
-- recorded nowhere, on the assumption it would be relayed to the practice. It
-- was not, and it was lost — leaving a seed that looked correct and unlocked
-- nothing. Never write a hash here unless a human has the PIN in durable
-- storage first.
--
-- Note the INSERT OR IGNORE: this seeds only a fresh database. If the migration
-- has already run, editing and re-running does nothing — rotate via the CMS, or
-- with an explicit UPDATE against admin_settings.
INSERT OR IGNORE INTO admin_settings (id, pin_hash, pin_salt) VALUES (
  1,
  'd7de1bebbdb2170b0d242f6dd3c12e21e4d8334159ef808ac8290302b4c0a7b9',
  'dc3bc6a6f8b33a40ff6c78702a46b720'
);
