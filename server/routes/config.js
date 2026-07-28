const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT whatsapp, telegram FROM admin_settings WHERE id = 1').get();
  res.json({ whatsapp: row.whatsapp || '', telegram: row.telegram || '' });
});

router.put('/', requireAuth, (req, res) => {
  const { whatsapp, telegram, current_pin, new_pin } = req.body;
  const db = getDb();
  const row = db.prepare('SELECT pin_hash FROM admin_settings WHERE id = 1').get();

  if (new_pin) {
    if (!current_pin) return res.status(400).json({ error: 'Current PIN required to set new PIN' });
    if (!bcrypt.compareSync(current_pin, row.pin_hash)) {
      return res.status(401).json({ error: 'Current PIN is incorrect' });
    }
    const hash = bcrypt.hashSync(new_pin, 10);
    db.prepare('UPDATE admin_settings SET pin_hash = ?, whatsapp = ?, telegram = ?, updated_at = datetime(\'now\') WHERE id = 1')
      .run(hash, whatsapp || '', telegram || '');
  } else {
    db.prepare('UPDATE admin_settings SET whatsapp = ?, telegram = ?, updated_at = datetime(\'now\') WHERE id = 1')
      .run(whatsapp || '', telegram || '');
  }

  res.json({ success: true, message: 'Settings updated' });
});

module.exports = router;
