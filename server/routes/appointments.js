const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.post('/', (req, res) => {
  const { patient_name, patient_phone, chamber, appointment_date, service, notes } = req.body;
  if (!patient_name || !patient_phone || !chamber || !appointment_date || !service) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = getDb();
  const id = 'book-' + uuidv4().slice(0, 8);
  db.prepare(`
    INSERT INTO appointments (id, patient_name, patient_phone, chamber, appointment_date, service, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, patient_name, patient_phone, chamber, appointment_date, service, notes || '');

  res.status(201).json({ id, message: 'Appointment created successfully' });
});

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM appointments ORDER BY created_at DESC').all();
  res.json(rows);
});

router.put('/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  if (!['Pending', 'Confirmed', 'Completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const db = getDb();
  const result = db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Appointment not found' });

  res.json({ success: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Appointment not found' });
  res.json({ success: true });
});

module.exports = router;
