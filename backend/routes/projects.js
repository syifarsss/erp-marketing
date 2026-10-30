const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get all projects with client details (mapping Prospect to frontend expected project format)
router.get('/', verifyToken, async (req, res) => {
  const { status, search } = req.query;

  try {
    let sql = `
      SELECT 
        p.no_project as id, 
        p.no_project, 
        p.name_project as name, 
        p.name_project, 
        p.client_name as company,
        p.client_name, 
        COALESCE(NULLIF(p.contact_name, ''), c.contact_pic) as contact_name, 
        CASE 
          WHEN UPPER(p.status) = 'LEAD' THEN 'Lead'
          WHEN UPPER(p.status) = 'PROPOSAL' THEN 'Proposal'
          WHEN UPPER(p.status) = 'HOLD' THEN 'Hold'
          WHEN UPPER(p.status) = 'LOSS' OR UPPER(p.status) = 'LOSE' OR UPPER(p.status) = 'REAL_LOSS' THEN 'Lose'
          WHEN UPPER(p.status) = 'WON' THEN 'Won'
          WHEN UPPER(p.status) = 'DONE' THEN 'Done'
          ELSE 'Lead'
        END as status,
        p.createdAt as created_at,
        p.createdAt, 
        p.updatedAt, 
        p.\`order\`, 
        p.last_contact_date as last_contact,
        p.last_contact_date,
        COALESCE(cls.phone, c.contact_phone) as phone,
        c.contact_email as email,
        COALESCE(cls.source, c.lead_source) as source,
        c.industry,
        c.logo as logo_url,
        c.is_verified as verified,
        COALESCE(cls.value, 0) as value,
        100 as lead_score,
        p.jenis_project,
        p.nilai_revenue
      FROM Prospect p
      LEFT JOIN Client c ON p.client_name = c.name
      LEFT JOIN clients cls ON p.client_name = cls.company
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      if (status === 'Lead') {
        sql += " AND UPPER(p.status) = 'LEAD'";
      } else if (status === 'Proposal') {
        sql += " AND UPPER(p.status) = 'PROPOSAL'";
      } else if (status === 'Hold') {
        sql += " AND UPPER(p.status) = 'HOLD'";
      } else if (status === 'Lose' || status === 'Loss') {
        sql += " AND (UPPER(p.status) = 'LOSS' OR UPPER(p.status) = 'LOSE' OR UPPER(p.status) = 'REAL_LOSS')";
      } else if (status === 'Won') {
        sql += " AND UPPER(p.status) = 'WON'";
      } else if (status === 'Done') {
        sql += " AND UPPER(p.status) = 'DONE'";
      } else {
        sql += ' AND p.status = ?';
        params.push(status);
      }
    }

    if (search) {
      sql += ' AND (p.name_project LIKE ? OR p.client_name LIKE ? OR p.contact_name LIKE ? OR p.no_project LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    sql += ' ORDER BY p.createdAt DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Fetch projects error:', err);
    res.status(500).json({ message: 'Gagal mengambil data proyek.' });
  }
});

// Get single project details (mapping Prospect to frontend details format)
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.no_project as id, 
        p.no_project, 
        p.name_project as name, 
        p.name_project, 
        p.client_name as company,
        p.client_name, 
        COALESCE(NULLIF(p.contact_name, ''), c.contact_pic) as contact_name, 
        CASE 
          WHEN UPPER(p.status) = 'LEAD' THEN 'Lead'
          WHEN UPPER(p.status) = 'PROPOSAL' THEN 'Proposal'
          WHEN UPPER(p.status) = 'HOLD' THEN 'Hold'
          WHEN UPPER(p.status) = 'LOSS' OR UPPER(p.status) = 'LOSE' OR UPPER(p.status) = 'REAL_LOSS' THEN 'Lose'
          WHEN UPPER(p.status) = 'WON' THEN 'Won'
          WHEN UPPER(p.status) = 'DONE' THEN 'Done'
          ELSE 'Lead'
        END as status,
        p.createdAt as created_at,
        p.createdAt, 
        p.updatedAt, 
        p.\`order\`, 
        p.last_contact_date as last_contact,
        p.last_contact_date,
        COALESCE(cls.phone, c.contact_phone) as phone,
        c.contact_email as email,
        COALESCE(cls.source, c.lead_source) as source,
        c.industry,
        c.logo as logo_url,
        c.is_verified as verified,
        COALESCE(cls.value, 0) as value,
        100 as lead_score,
        c.id as client_real_id,
        p.jenis_project,
        p.nilai_revenue
      FROM Prospect p
      LEFT JOIN Client c ON p.client_name = c.name
      LEFT JOIN clients cls ON p.client_name = cls.company
      WHERE p.no_project = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Prospek tidak ditemukan.' });
    }

    const lead = rows[0];

    let interactions = [];
    if (lead.client_real_id) {
      const [interactRows] = await pool.query(
        `SELECT i.*, u.name as creator_name, CONCAT('https://api.dicebear.com/7.x/adventurer/svg?seed=', COALESCE(u.name, u.username, 'Admin')) as creator_avatar 
          FROM lead_interactions i 
          LEFT JOIN User u ON i.created_by = u.id 
          WHERE i.lead_id = ? 
          ORDER BY i.created_at DESC`,
         [lead.client_real_id]
      );
      interactions = interactRows;
    }

    res.json({
      lead,
      interactions,
      contacts: []
    });
  } catch (err) {
    console.error('Fetch project details error:', err);
    res.status(500).json({ message: 'Gagal mengambil detail prospek.' });
  }
});

// Create project / prospect
router.post('/', verifyToken, async (req, res) => {
  const { 
    no_project, 
    id, 
    name_project, 
    name, 
    client_name, 
    client_id, 
    contact_name, 
    status, 
    order, 
    last_contact_date,
    value,
    phone,
    notes,
    source,
    deadline
  } = req.body;

  const final_name_project = name_project || name;
  const final_client_name = client_name || client_id;

  if (!final_name_project || !final_client_name) {
    return res.status(400).json({ message: 'Nama proyek dan nama client wajib diisi.' });
  }

  try {
    const final_contact_name = contact_name || '';
    const final_status = status || 'LEAD';
    const final_order = order || 0;
    const final_last_contact = last_contact_date || null;

    // Parse leading number from project name (e.g. "14. CFD Modelling" -> 14)
    const numMatch = final_name_project.trim().match(/^(\d+)\./);
    let prefixNum = numMatch ? numMatch[1] : null;
    if (!prefixNum) {
      // Fallback: count how many rows are currently in the Prospect table + 1
      const [countRows] = await pool.query('SELECT COUNT(*) as count FROM Prospect');
      prefixNum = countRows[0].count + 1;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    let baseCode = `${prefixNum}.IMX-${year}-${month}-${day}`;
    let computed_no_project = baseCode;
    let check = true;
    let counter = 1;
    while (check) {
      const [existing] = await pool.query('SELECT no_project FROM Prospect WHERE no_project = ?', [computed_no_project]);
      if (existing.length === 0) {
        check = false;
      } else {
        counter++;
        computed_no_project = `${baseCode}-${counter}`;
      }
    }

    // Sync to clients table
    const [existingClient] = await pool.query('SELECT id FROM clients WHERE company = ?', [final_client_name]);
    if (existingClient.length > 0) {
      await pool.query(
        `UPDATE clients SET name = ?, phone = ?, value = ?, notes = ?, source = ?, deadline = ?, status = ? WHERE company = ?`,
        [final_contact_name, phone || '', parseFloat(value) || 0, notes || '', source || 'Organic', deadline || null, final_status.toUpperCase(), final_client_name]
      );
    } else {
      await pool.query(
        `INSERT INTO clients (name, company, phone, value, notes, source, deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [final_contact_name, final_client_name, phone || '', parseFloat(value) || 0, notes || '', source || 'Organic', deadline || null, final_status.toUpperCase()]
      );
    }

    // Sync to Client (singular) table
    const [existingClientSingular] = await pool.query('SELECT id FROM Client WHERE name = ?', [final_client_name]);
    if (existingClientSingular.length > 0) {
      await pool.query(
        `UPDATE Client SET contact_pic = ?, contact_phone = ?, lead_source = ?, status = ? WHERE name = ?`,
        [final_contact_name, phone || '', source || 'Organic', final_status.toUpperCase(), final_client_name]
      );
    } else {
      await pool.query(
        `INSERT INTO Client (name, contact_pic, contact_phone, lead_source, status) VALUES (?, ?, ?, ?, ?)`,
        [final_client_name, final_contact_name, phone || '', source || 'Organic', final_status.toUpperCase()]
      );
    }

    await pool.query(`
      INSERT INTO Prospect (no_project, name_project, client_name, contact_name, status, createdAt, updatedAt, \`order\`, last_contact_date)
      VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3), ?, ?)
    `, [
      computed_no_project,
      final_name_project,
      final_client_name,
      final_contact_name,
      final_status,
      final_order,
      final_last_contact
    ]);

    res.status(201).json({
      message: 'Proyek berhasil dibuat.',
      projectId: computed_no_project,
      no_project: computed_no_project
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ message: 'Gagal membuat proyek baru.' });
  }
});

// Update project status, progress or info
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { 
    name_project, 
    name, 
    client_name, 
    contact_name, 
    status, 
    order, 
    last_contact_date,
    value,
    phone,
    notes,
    source,
    deadline,
    jenis_project,
    nilai_revenue
  } = req.body;

  try {
    // Fetch current record
    const [existing] = await pool.query('SELECT * FROM Prospect WHERE no_project = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Proyek tidak ditemukan.' });
    }

    const current = existing[0];
    const final_name_project = name_project !== undefined ? name_project : (name !== undefined ? name : current.name_project);
    const final_client_name = client_name !== undefined ? client_name : current.client_name;
    const final_contact_name = contact_name !== undefined ? contact_name : current.contact_name;
    const final_status = status !== undefined ? status : current.status;
    const final_order = order !== undefined ? order : current.order;
    const final_last_contact = last_contact_date !== undefined ? last_contact_date : current.last_contact_date;
    const final_jenis_project = jenis_project !== undefined ? jenis_project : current.jenis_project;
    const final_nilai_revenue = nilai_revenue !== undefined
      ? (nilai_revenue !== null && nilai_revenue !== '' ? parseFloat(nilai_revenue) : null)
      : current.nilai_revenue;

    await pool.query(`
      UPDATE Prospect 
      SET name_project = ?, client_name = ?, contact_name = ?, status = ?, updatedAt = NOW(3), \`order\` = ?, last_contact_date = ?, jenis_project = ?, nilai_revenue = ?
      WHERE no_project = ?
    `, [
      final_name_project,
      final_client_name,
      final_contact_name,
      final_status,
      final_order,
      final_last_contact,
      final_jenis_project || null,
      final_nilai_revenue,
      id
    ]);

    // --- Performance Tracking: Auto-create realization when status changes to DONE ---
    const newStatusUpper = final_status.toUpperCase();
    if (newStatusUpper === 'DONE' || newStatusUpper === 'WON') {
      if (!final_jenis_project || final_jenis_project.trim() === '') {
        // Warning: jenis_project not filled — still update the prospect, just warn
        // Complete client sync first, then return with warning
        // (We use a flag approach to return warning after sync is done)
      } else {
        try {
          const [existingReal] = await pool.query(
            'SELECT id FROM performance_realizations WHERE kanban_card_id = ?',
            [id]
          );
          const today = new Date().toISOString().slice(0, 10);
          const tahunRealisasi = new Date(today).getFullYear();

          if (existingReal.length === 0) {
            // No existing record — create new
            await pool.query(
              `INSERT INTO performance_realizations
                 (tahun, jenis_project, nama_project, nilai_revenue, tanggal_selesai, sumber, kanban_card_id, dibuat_oleh)
               VALUES (?, ?, ?, ?, ?, 'kanban', ?, ?)`,
              [tahunRealisasi, final_jenis_project, final_name_project, final_nilai_revenue || 0, today, id, req.user.id]
            );
          } else {
            // Record exists — update jenis_project, nama_project, nilai_revenue in case they changed
            await pool.query(
              `UPDATE performance_realizations
               SET jenis_project = ?, nama_project = ?, nilai_revenue = ?, updated_at = NOW()
               WHERE kanban_card_id = ?`,
              [final_jenis_project, final_name_project, final_nilai_revenue || 0, id]
            );
          }
        } catch (realErr) {
          // Don't block status update on realization failure — log and continue
          console.error('Performance realization auto-create error (non-blocking):', realErr);
        }
      }
    }
    // --- End Performance Tracking trigger ---

    // Fetch existing client info to see current values if they are undefined
    const [existingClient] = await pool.query('SELECT * FROM clients WHERE company = ?', [final_client_name]);
    if (existingClient.length > 0) {
      const currentClient = existingClient[0];
      const final_phone = phone !== undefined ? phone : currentClient.phone;
      const final_value = value !== undefined ? value : currentClient.value;
      const final_notes = notes !== undefined ? notes : currentClient.notes;
      const final_source = source !== undefined ? source : currentClient.source;
      const final_deadline = deadline !== undefined ? deadline : currentClient.deadline;

      await pool.query(
        `UPDATE clients SET name = ?, phone = ?, value = ?, notes = ?, source = ?, deadline = ?, status = ? WHERE company = ?`,
        [final_contact_name, final_phone || '', parseFloat(final_value) || 0, final_notes || '', final_source || 'Organic', final_deadline || null, final_status.toUpperCase(), final_client_name]
      );
    } else {
      await pool.query(
        `INSERT INTO clients (name, company, phone, value, notes, source, deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [final_contact_name, final_client_name, phone || '', parseFloat(value) || 0, notes || '', source || 'Organic', deadline || null, final_status.toUpperCase()]
      );
    }

    // Sync to Client (singular) table
    const [existingClientSingular] = await pool.query('SELECT * FROM Client WHERE name = ?', [final_client_name]);
    if (existingClientSingular.length > 0) {
      const currentClientSingular = existingClientSingular[0];
      const final_phone_singular = phone !== undefined ? phone : currentClientSingular.contact_phone;
      const final_source_singular = source !== undefined ? source : currentClientSingular.lead_source;

      await pool.query(
        `UPDATE Client SET contact_pic = ?, contact_phone = ?, lead_source = ?, status = ? WHERE name = ?`,
        [final_contact_name, final_phone_singular || '', final_source_singular || 'Organic', final_status.toUpperCase(), final_client_name]
      );
    } else {
      await pool.query(
        `INSERT INTO Client (name, contact_pic, contact_phone, lead_source, status) VALUES (?, ?, ?, ?, ?)`,
        [final_client_name, final_contact_name, phone || '', source || 'Organic', final_status.toUpperCase()]
      );
    }

    if ((newStatusUpper === 'DONE' || newStatusUpper === 'WON') && (!final_jenis_project || final_jenis_project.trim() === '')) {
      return res.json({
        message: 'Proyek berhasil diperbarui.',
        warning: 'Realisasi tidak dicatat otomatis karena jenis project belum diisi.'
      });
    }
    res.json({ message: 'Proyek berhasil diperbarui.' });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ message: 'Gagal memperbarui data proyek.' });
  }
});

// Delete project
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Prospect WHERE no_project = ?', [id]);
    res.json({ message: 'Proyek berhasil dihapus.' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ message: 'Gagal menghapus proyek.' });
  }
});

module.exports = router;
