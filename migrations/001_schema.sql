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

-- PBKDF2-SHA256, 100k iterations, per-install salt. The previous seed was an
-- unsalted single-round SHA-256 of a PIN that had leaked publicly; both the hash
-- and that PIN are revoked. The plaintext for this hash is deliberately recorded
-- nowhere in this repository — it is handed to the practice out of band.
INSERT OR IGNORE INTO admin_settings (id, pin_hash, pin_salt) VALUES (
  1,
  '5aca72bfe827f0d3dc21adcdae5fcd001d7d593f9b918fda73e29be5acfa940c',
  'cd83e982568eef34dd1502845d7667d1'
);
