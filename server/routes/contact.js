const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = Router();

router.post('/', (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }

  const db = getDb();
  const id = 'msg-' + uuidv4().slice(0, 8);
  db.prepare(`
    INSERT INTO contact_messages (id, name, email, phone, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, email || '', phone || '', message);

  res.status(201).json({ id, message: 'Message received. Dr. Pervin will respond shortly.' });
});

router.get('/', (req, res) => {
  const from = req.query.from;
  if (from !== 'portfoliosumyapervin') {
    return res.status(403).json({ error: 'Invalid access code' });
  }
  const db = getDb();
  const rows = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
  res.json(rows);
});

module.exports = router;
