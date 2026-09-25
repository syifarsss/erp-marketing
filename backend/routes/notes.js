const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Ensure notes table exists
const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NULL,
      category ENUM('Masalah','Temuan','Ide','Lainnya') NOT NULL DEFAULT 'Lainnya',
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES User(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

// GET all notes
router.get('/', verifyToken, async (req, res) => {
  try {
    await ensureTable();
    const { search, category } = req.query;
    let query = `
      SELECT n.*, u.name AS author_name
      FROM notes n
      LEFT JOIN User u ON n.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'Semua') {
      query += ' AND n.category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (n.title LIKE ? OR n.content LIKE ? OR u.name LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    query += ' ORDER BY n.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /notes error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET single note
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, u.name AS author_name FROM notes n LEFT JOIN User u ON n.created_by = u.id WHERE n.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Catatan tidak ditemukan.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create note
router.post('/', verifyToken, async (req, res) => {
  try {
    await ensureTable();
    const { title, content, category } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: 'Judul catatan wajib diisi.' });

    const [result] = await pool.query(
      'INSERT INTO notes (title, content, category, created_by) VALUES (?, ?, ?, ?)',
      [title.trim(), content || '', category || 'Lainnya', req.user.id]
    );
    const [rows] = await pool.query(
      `SELECT n.*, u.name AS author_name FROM notes n LEFT JOIN User u ON n.created_by = u.id WHERE n.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /notes error:', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT update note
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const [existing] = await pool.query('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Catatan tidak ditemukan.' });

    if (existing[0].created_by !== req.user.id && !['Superadmin', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Anda tidak berhak mengedit catatan ini.' });
    }

    await pool.query(
      'UPDATE notes SET title = ?, content = ?, category = ?, updated_at = NOW() WHERE id = ?',
      [title || existing[0].title, content !== undefined ? content : existing[0].content, category || existing[0].category, req.params.id]
    );
    const [rows] = await pool.query(
      `SELECT n.*, u.name AS author_name FROM notes n LEFT JOIN User u ON n.created_by = u.id WHERE n.id = ?`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE note
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Catatan tidak ditemukan.' });

    if (existing[0].created_by !== req.user.id && !['Superadmin', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Anda tidak berhak menghapus catatan ini.' });
    }

    await pool.query('DELETE FROM notes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Catatan berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
