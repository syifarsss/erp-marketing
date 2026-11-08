const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const VALID_JENIS = ['CFD', 'FEA', 'Engineering Package', 'Process Simulation', 'Other'];

// GET /api/performance/targets?tahun=YYYY
router.get('/targets', verifyToken, async (req, res) => {
  const { tahun } = req.query;
  if (!tahun) return res.status(400).json({ message: 'Parameter tahun wajib diisi.' });

  const parsedTahun = parseInt(tahun, 10);
  if (isNaN(parsedTahun)) return res.status(400).json({ message: 'Parameter tahun harus berupa angka yang valid.' });

  try {
    const [rows] = await pool.query(
      'SELECT jenis_project, target_project, harga_per_project FROM performance_targets WHERE tahun = ?',
      [parsedTahun]
    );

    const dbMap = {};
    for (const row of rows) dbMap[row.jenis_project] = row;

    const result = VALID_JENIS.map((jenis) => {
      const row = dbMap[jenis];
      if (row) {
        const tp = parseInt(row.target_project, 10) || 0;
        const hpp = parseFloat(row.harga_per_project) || 0;
        return {
          jenis_project: jenis,
          target_project: tp,
          harga_per_project: hpp,
          target_revenue: tp * hpp   // computed, not stored
        };
      }
      return { jenis_project: jenis, target_project: 0, harga_per_project: 0, target_revenue: 0 };
    });

    res.json(result);
  } catch (err) {
    console.error('Fetch performance targets error:', err);
    res.status(500).json({ message: 'Gagal mengambil data target kinerja.' });
  }
});

// POST /api/performance/targets — Superadmin only
router.post('/targets', verifyToken, requireRole(['Superadmin']), async (req, res) => {
  const { tahun, targets } = req.body;

  if (!tahun || !Array.isArray(targets) || targets.length === 0) {
    return res.status(400).json({ message: 'Data tahun dan targets wajib diisi.' });
  }

  const parsedTahun = parseInt(tahun, 10);
  if (isNaN(parsedTahun)) return res.status(400).json({ message: 'Parameter tahun harus berupa angka yang valid.' });

  for (const row of targets) {
    if (!VALID_JENIS.includes(row.jenis_project)) {
      return res.status(400).json({ message: `Jenis project tidak valid: "${row.jenis_project}".` });
    }
    if (parseFloat(row.harga_per_project) < 0) {
      return res.status(400).json({ message: 'Nilai harga_per_project tidak boleh negatif.' });
    }
    if (parseInt(row.target_project, 10) < 0) {
      return res.status(400).json({ message: 'Nilai target_project tidak boleh negatif.' });
    }
  }

  try {
    for (const row of targets) {
      const tp = parseInt(row.target_project, 10) || 0;
      const hpp = parseFloat(row.harga_per_project) || 0;
      await pool.query(
        `INSERT INTO performance_targets (tahun, jenis_project, target_project, harga_per_project)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           target_project = VALUES(target_project),
           harga_per_project = VALUES(harga_per_project),
           updated_at = NOW()`,
        [parsedTahun, row.jenis_project, tp, hpp]
      );
    }
    res.json({ message: 'Target berhasil disimpan.' });
  } catch (err) {
    console.error('Save performance targets error:', err);
    res.status(500).json({ message: 'Gagal menyimpan data target kinerja.' });
  }
});

// GET /api/performance/realizations/list?tahun=YYYY
// Returns individual (non-aggregated) realization records for a year
router.get('/realizations/list', verifyToken, async (req, res) => {
  const { tahun } = req.query;
  if (!tahun) return res.status(400).json({ message: 'Parameter tahun wajib diisi.' });

  const parsedTahun = parseInt(tahun, 10);
  if (isNaN(parsedTahun)) return res.status(400).json({ message: 'Parameter tahun harus berupa angka yang valid.' });

  try {
    const [rows] = await pool.query(
      `SELECT id, jenis_project, nama_project, nilai_revenue, tanggal_selesai, sumber, kanban_card_id
       FROM performance_realizations
       WHERE tahun = ?
       ORDER BY tanggal_selesai DESC, id DESC`,
      [parsedTahun]
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch realization list error:', err);
    res.status(500).json({ message: 'Gagal mengambil daftar realisasi.' });
  }
});

// GET /api/performance/realizations?tahun=YYYY
// Returns aggregated realizations per jenis_project + targets for the year
router.get('/realizations', verifyToken, async (req, res) => {
  const { tahun } = req.query;
  if (!tahun) return res.status(400).json({ message: 'Parameter tahun wajib diisi.' });

  const parsedTahun = parseInt(tahun, 10);
  if (isNaN(parsedTahun)) return res.status(400).json({ message: 'Parameter tahun harus berupa angka yang valid.' });

  try {
    // Fetch targets
    const [targetRows] = await pool.query(
      'SELECT jenis_project, target_project, harga_per_project FROM performance_targets WHERE tahun = ?',
      [parsedTahun]
    );
    const targetMap = {};
    for (const t of targetRows) targetMap[t.jenis_project] = t;

    // Fetch aggregated realizations
    const [realRows] = await pool.query(
      `SELECT jenis_project, SUM(nilai_revenue) AS total_revenue, COUNT(*) AS total_project
       FROM performance_realizations
       WHERE tahun = ?
       GROUP BY jenis_project`,
      [parsedTahun]
    );
    const realMap = {};
    for (const r of realRows) realMap[r.jenis_project] = r;

    // Merge with VALID_JENIS — always 5 elements
    const targets = VALID_JENIS.map((jenis) => {
      const t = targetMap[jenis];
      const tp = t ? parseInt(t.target_project, 10) || 0 : 0;
      const hpp = t ? parseFloat(t.harga_per_project) || 0 : 0;
      return {
        jenis_project: jenis,
        target_project: tp,
        harga_per_project: hpp,
        target_revenue: tp * hpp  // rupiah penuh, computed
      };
    });
    const realizations = VALID_JENIS.map((jenis) => ({
      jenis_project: jenis,
      total_revenue: realMap[jenis] ? parseFloat(realMap[jenis].total_revenue) || 0 : 0,
      total_project: realMap[jenis] ? parseInt(realMap[jenis].total_project, 10) || 0 : 0
    }));

    res.json({ targets, realizations });
  } catch (err) {
    console.error('Fetch performance realizations error:', err);
    res.status(500).json({ message: 'Gagal mengambil data realisasi kinerja.' });
  }
});

// POST /api/performance/realizations
// Add a manual realization record — Superadmin only
router.post('/realizations', verifyToken, requireRole(['Superadmin']), async (req, res) => {
  const { jenis_project, nama_project, nilai_revenue, tanggal_selesai } = req.body;

  if (!VALID_JENIS.includes(jenis_project)) {
    return res.status(400).json({
      message: `Jenis project tidak valid. Pilihan: ${VALID_JENIS.join(', ')}.`
    });
  }
  if (!nama_project || !nama_project.trim()) {
    return res.status(400).json({ message: 'Nama project wajib diisi.' });
  }
  if (parseFloat(nilai_revenue) < 0) {
    return res.status(400).json({ message: 'Nilai revenue tidak boleh negatif.' });
  }
  if (!tanggal_selesai) {
    return res.status(400).json({ message: 'Tanggal selesai wajib diisi.' });
  }

  // Derive tahun from tanggal_selesai
  const tahun = new Date(tanggal_selesai).getFullYear();
  if (isNaN(tahun)) {
    return res.status(400).json({ message: 'Format tanggal selesai tidak valid.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO performance_realizations
         (tahun, jenis_project, nama_project, nilai_revenue, tanggal_selesai, sumber, kanban_card_id, dibuat_oleh)
       VALUES (?, ?, ?, ?, ?, 'manual', NULL, ?)`,
      [tahun, jenis_project, nama_project.trim(), parseFloat(nilai_revenue) || 0, tanggal_selesai, req.user.id]
    );
    res.status(201).json({ message: 'Realisasi berhasil ditambahkan.', id: result.insertId });
  } catch (err) {
    console.error('Add realization error:', err);
    res.status(500).json({ message: 'Gagal menambahkan data realisasi.' });
  }
});

// PUT /api/performance/realizations/:id
// Update a realization record — Superadmin only
router.put('/realizations/:id', verifyToken, requireRole(['Superadmin']), async (req, res) => {
  const { id } = req.params;
  const { jenis_project, nama_project, nilai_revenue, tanggal_selesai } = req.body;

  if (!VALID_JENIS.includes(jenis_project)) {
    return res.status(400).json({
      message: `Jenis project tidak valid. Pilihan: ${VALID_JENIS.join(', ')}.`
    });
  }
  if (!nama_project || !nama_project.trim()) {
    return res.status(400).json({ message: 'Nama project wajib diisi.' });
  }
  if (parseFloat(nilai_revenue) < 0) {
    return res.status(400).json({ message: 'Nilai revenue tidak boleh negatif.' });
  }
  if (!tanggal_selesai) {
    return res.status(400).json({ message: 'Tanggal selesai wajib diisi.' });
  }

  const tahun = new Date(tanggal_selesai).getFullYear();
  if (isNaN(tahun)) {
    return res.status(400).json({ message: 'Format tanggal selesai tidak valid.' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM performance_realizations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Catatan realisasi tidak ditemukan.' });
    }

    await pool.query(
      `UPDATE performance_realizations
       SET tahun = ?, jenis_project = ?, nama_project = ?, nilai_revenue = ?, tanggal_selesai = ?, updated_at = NOW()
       WHERE id = ?`,
      [tahun, jenis_project, nama_project.trim(), parseFloat(nilai_revenue) || 0, tanggal_selesai, id]
    );
    res.json({ message: 'Realisasi berhasil diperbarui.' });
  } catch (err) {
    console.error('Update realization error:', err);
    res.status(500).json({ message: 'Gagal memperbarui data realisasi.' });
  }
});

// DELETE /api/performance/realizations/:id
// Delete a realization record — Superadmin only
router.delete('/realizations/:id', verifyToken, requireRole(['Superadmin']), async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await pool.query('SELECT id FROM performance_realizations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Catatan realisasi tidak ditemukan.' });
    }
    await pool.query('DELETE FROM performance_realizations WHERE id = ?', [id]);
    res.json({ message: 'Realisasi berhasil dihapus.' });
  } catch (err) {
    console.error('Delete realization error:', err);
    res.status(500).json({ message: 'Gagal menghapus data realisasi.' });
  }
});

// GET /api/performance/public-summary?tahun=YYYY
// Public endpoint — no auth required — for ERP Dashboard cross-origin fetch
router.get('/public-summary', async (req, res) => {
  const tahun = parseInt(req.query.tahun, 10) || new Date().getFullYear();

  try {
    const [targetRows] = await pool.query(
      'SELECT jenis_project, target_project, harga_per_project FROM performance_targets WHERE tahun = ?',
      [tahun]
    );
    const [realRows] = await pool.query(
      `SELECT jenis_project, SUM(nilai_revenue) AS total_revenue, COUNT(*) AS total_project
       FROM performance_realizations WHERE tahun = ? GROUP BY jenis_project`,
      [tahun]
    );

    const revenueTarget   = targetRows.reduce((s, t) => s + (parseInt(t.target_project, 10) || 0) * (parseFloat(t.harga_per_project) || 0), 0);
    const projectTarget   = targetRows.reduce((s, t) => s + (parseInt(t.target_project, 10) || 0), 0);
    const revenueRealisasi = realRows.reduce((s, r) => s + (parseFloat(r.total_revenue) || 0), 0);
    const projectRealisasi = realRows.reduce((s, r) => s + (parseInt(r.total_project, 10) || 0), 0);

    res.json({ tahun, revenueTarget, projectTarget, revenueRealisasi, projectRealisasi });
  } catch (err) {
    console.error('Public summary error:', err);
    res.status(500).json({ message: 'Gagal mengambil data.' });
  }
});

module.exports = router;
