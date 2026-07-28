const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');

const router = Router();

router.post('/login', (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN is required' });

  const db = getDb();
  const row = db.prepare('SELECT pin_hash FROM admin_settings WHERE id = 1').get();
  if (!row || !bcrypt.compareSync(pin, row.pin_hash)) {
    return res.status(401).json({ error: 'Incorrect PIN' });
  }

  req.session.authenticated = true;
  res.json({ success: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get('/check', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

module.exports = router;
