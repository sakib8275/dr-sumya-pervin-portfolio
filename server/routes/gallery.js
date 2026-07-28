const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename(req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'gallery-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = /\.(jpg|jpeg|png|webp|gif)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  }
});

router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM gallery ORDER BY created_at DESC').all();
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { title, category, caption, image_path } = req.body;
  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category are required' });
  }

  const db = getDb();
  const id = 'item-' + uuidv4().slice(0, 8);
  const imgPath = image_path || '/api/uploads/placeholder.jpg';
  db.prepare(`
    INSERT INTO gallery (id, title, category, caption, image_path)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, title, category, caption || '', imgPath);

  res.status(201).json({ id, message: 'Gallery item created' });
});

router.post('/upload', requireAuth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 10MB)' });
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const imagePath = '/api/uploads/' + req.file.filename;
    res.json({ image_path: imagePath, filename: req.file.filename });
  });
});

router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT image_path FROM gallery WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Gallery item not found' });

  db.prepare('DELETE FROM gallery WHERE id = ?').run(req.params.id);

  const fs = require('fs');
  if (item.image_path && item.image_path.startsWith('/api/uploads/')) {
    const filePath = path.join(__dirname, '..', item.image_path.replace('/api/uploads/', 'uploads/'));
    try { fs.unlinkSync(filePath); } catch (e) { /* file may not exist */ }
  }

  res.json({ success: true });
});

module.exports = router;
