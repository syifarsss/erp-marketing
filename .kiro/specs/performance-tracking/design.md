# Design Document — Performance Tracking

## Overview

Fitur **Performance Tracking** menambahkan subsistem baru ke Infimech ERP Marketing yang memungkinkan Superadmin menetapkan target kinerja tahunan (revenue dan jumlah project per jenis project) serta semua pengguna melihat realisasi aktual dibandingkan target tersebut.

Implementasi mencakup:
- Dua tabel database baru (`performance_targets`, `performance_realizations`)
- Dua kolom baru di tabel `Prospect` (`jenis_project`, `nilai_revenue`)
- Satu file route backend baru (`routes/performance.js`)
- Modifikasi `routes/projects.js` untuk trigger otomatis realisasi saat status kartu berubah ke `Done`
- Penambahan grup sidebar "Performance" dengan dua view di `App.jsx`
- Modifikasi modal edit kartu Kanban di `App.jsx` untuk field baru

Fitur ini **tidak mencakup** grafik tren bulanan, ekspor laporan, atau ringkasan di dashboard utama.

---

## Architecture

### Alur Data Keseluruhan

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (App.jsx)                       │
│                                                                 │
│  Sidebar                                                        │
│  └─ Grup "Performance" (performanceDropdownOpen state)          │
│     ├─ "Target"      → setCurrentView('performance-target')     │
│     └─ "Realisasi"   → setCurrentView('performance-realisasi')  │
│                                                                 │
│  View: performance-target                                       │
│  ├─ Selektor Tahun (targetYear state)                           │
│  ├─ Kartu Target Revenue (targetForm state)                     │
│  └─ Kartu Target Project (targetForm state)                     │
│                                                                 │
│  View: performance-realisasi                                    │
│  ├─ Selektor Tahun (realisasiYear state)                        │
│  ├─ Kartu Realisasi Revenue (realizations state)                │
│  ├─ Kartu Realisasi Project (realizations state)                │
│  └─ Tabel Riwayat (realizationList state)                       │
│                                                                 │
│  Modal Edit Kanban (fuEditModalOpen)                            │
│  ├─ Dropdown "Jenis Project" (fuEditForm.jenis_project)         │
│  └─ Input "Nilai Revenue"    (fuEditForm.nilai_revenue)         │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP (fetch + Bearer JWT)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (Express)                        │
│                                                                 │
│  routes/performance.js                                          │
│  ├─ GET  /api/performance/targets?tahun=YYYY                    │
│  ├─ POST /api/performance/targets           (Superadmin)        │
│  ├─ GET  /api/performance/realizations?tahun=YYYY               │
│  ├─ GET  /api/performance/realizations/list?tahun=YYYY          │
│  ├─ POST /api/performance/realizations      (Superadmin)        │
│  ├─ PUT  /api/performance/realizations/:id  (Superadmin)        │
│  └─ DELETE /api/performance/realizations/:id (Superadmin)       │
│                                                                 │
│  routes/projects.js (modifikasi PUT /:id)                       │
│  └─ Trigger realisasi otomatis saat status → DONE               │
└────────────────────────┬────────────────────────────────────────┘
                         │ mysql2/promise pool
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE (MySQL)                        │
│                                                                 │
│  performance_targets        performance_realizations            │
│  Prospect (+ 2 kolom baru)  User (referensi FK)                 │
└─────────────────────────────────────────────────────────────────┘
```

### Keputusan Arsitektur

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Penyimpanan target | Tabel terpisah `performance_targets` | Memisahkan concern; tidak mencemari tabel `Prospect` atau `clients` |
| UPSERT target | `INSERT ... ON DUPLICATE KEY UPDATE` | Satu operasi atomik; memanfaatkan constraint UNIQUE |
| Trigger realisasi | Dalam `PUT /:id` di `routes/projects.js` | Koherensi — perubahan status dan pencatatan realisasi terjadi dalam satu transaksi logis |
| Satuan `target_revenue` | Miliar rupiah (DECIMAL) | Input dari Superadmin lebih praktis; konversi ke rupiah penuh dilakukan saat kalkulasi |
| Satuan `nilai_revenue` realisasi | Rupiah penuh (DECIMAL) | Konsisten dengan field `value` di tabel `clients` |

---

## Components and Interfaces

### 3.1 Backend — `routes/performance.js`

File baru, CommonJS. Semua route menggunakan `verifyToken`. Route modifikasi data menggunakan `requireRole(['Superadmin'])`.

```
GET /api/performance/targets?tahun=YYYY
  Auth: verifyToken
  Query: tahun (integer, wajib)
  Response 200: [{ jenis_project, target_revenue, target_project }] — array 5 elemen (satu per jenis)
  Response 400: { message } jika tahun tidak diberikan

POST /api/performance/targets
  Auth: verifyToken + requireRole(['Superadmin'])
  Body: { tahun: integer, targets: [{ jenis_project, target_revenue, target_project }] }
  Validasi: target_revenue >= 0, target_project >= 0 (integer), jenis_project valid
  Logic: INSERT ... ON DUPLICATE KEY UPDATE untuk setiap elemen array
  Response 200: { message: 'Target berhasil disimpan.' }
  Response 400: { message } jika validasi gagal
  Response 403: { message } jika bukan Superadmin

GET /api/performance/realizations?tahun=YYYY
  Auth: verifyToken
  Query: tahun (integer, wajib)
  Response 200: {
    targets: [{ jenis_project, target_revenue, target_project }],
    realizations: [{ jenis_project, total_revenue, total_project }]
  }
  — keduanya array 5 elemen, satu per jenis project
  — jenis_project yang belum ada di DB dikembalikan dengan nilai 0

GET /api/performance/realizations/list?tahun=YYYY
  Auth: verifyToken
  Query: tahun (integer, wajib)
  Response 200: [{ id, jenis_project, nama_project, nilai_revenue, tanggal_selesai, sumber, kanban_card_id }]

POST /api/performance/realizations
  Auth: verifyToken + requireRole(['Superadmin'])
  Body: { jenis_project, nama_project, nilai_revenue, tanggal_selesai }
  Validasi: jenis_project dalam VALID_JENIS, nilai_revenue >= 0, tanggal_selesai valid date
  Logic: hitung tahun dari tanggal_selesai; set sumber='manual', kanban_card_id=NULL, dibuat_oleh=req.user.id
  Response 201: { message, id }
  Response 400: { message } jika validasi gagal

PUT /api/performance/realizations/:id
  Auth: verifyToken + requireRole(['Superadmin'])
  Body: { jenis_project, nama_project, nilai_revenue, tanggal_selesai }
  Validasi: sama dengan POST
  Response 200: { message }
  Response 404: { message } jika id tidak ditemukan

DELETE /api/performance/realizations/:id
  Auth: verifyToken + requireRole(['Superadmin'])
  Response 200: { message }
  Response 404: { message } jika id tidak ditemukan
```

**Konstanta yang diperlukan di file ini:**

```javascript
const VALID_JENIS = ['CFD', 'FEA', 'Engineering Package', 'Process Simulation', 'Other'];
```

### 3.2 Backend — Modifikasi `routes/projects.js` (PUT /:id)

Setelah `UPDATE Prospect SET ...`, tambahkan dua blok:

**Blok 1 — Simpan jenis_project dan nilai_revenue ke Prospect:**

```javascript
// Di dalam handler PUT /:id, sertakan kolom baru dalam UPDATE
const final_jenis_project = req.body.jenis_project !== undefined
  ? req.body.jenis_project
  : current.jenis_project;
const final_nilai_revenue = req.body.nilai_revenue !== undefined
  ? parseFloat(req.body.nilai_revenue) || null
  : current.nilai_revenue;

// Query UPDATE Prospect diperluas:
await pool.query(`
  UPDATE Prospect
  SET name_project=?, client_name=?, contact_name=?, status=?,
      updatedAt=NOW(3), \`order\`=?, last_contact_date=?,
      jenis_project=?, nilai_revenue=?
  WHERE no_project=?
`, [
  final_name_project, final_client_name, final_contact_name,
  final_status, final_order, final_last_contact,
  final_jenis_project || null,
  final_nilai_revenue,
  id
]);
```

**Blok 2 — Trigger realisasi otomatis (setelah UPDATE Prospect):**

```javascript
// Trigger hanya saat status berubah ke DONE
const newStatusUpper = final_status.toUpperCase();
const oldStatusUpper = (current.status || '').toUpperCase();

if (newStatusUpper === 'DONE') {
  if (!final_jenis_project || final_jenis_project.trim() === '') {
    // Peringatan: jenis_project kosong, realisasi tidak dibuat
    // Respons tetap 200 tapi sertakan warning
    return res.json({
      message: 'Proyek berhasil diperbarui.',
      warning: 'Realisasi tidak dicatat otomatis karena jenis project belum diisi.'
    });
  }

  // Cek apakah sudah ada realisasi untuk kartu ini
  const [existingReal] = await pool.query(
    'SELECT id FROM performance_realizations WHERE kanban_card_id = ?',
    [id]
  );

  if (existingReal.length === 0) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const tahun = new Date().getFullYear();
    await pool.query(`
      INSERT INTO performance_realizations
        (tahun, jenis_project, nama_project, nilai_revenue, tanggal_selesai, sumber, kanban_card_id, dibuat_oleh)
      VALUES (?, ?, ?, ?, ?, 'kanban', ?, ?)
    `, [
      tahun,
      final_jenis_project,
      final_name_project,
      final_nilai_revenue || 0,
      today,
      id,          // kanban_card_id = no_project (string)
      req.user.id
    ]);
  }
  // Jika sudah ada (kanban_card_id duplikat), lewati diam-diam
}

res.json({ message: 'Proyek berhasil diperbarui.' });
```

> **Catatan:** `kanban_card_id` di tabel `performance_realizations` perlu berupa VARCHAR karena `no_project` di tabel `Prospect` adalah string (misal `"14.IMX-2025-07-10"`). Lihat Data Models.

### 3.3 Backend — Modifikasi `server.js`

Tambahkan satu baris di blok register routes:

```javascript
app.use('/api/performance', require('./routes/performance'));
```

### 3.4 Frontend — State Baru di `App.jsx`

Tambahkan state-state berikut di dalam fungsi `App()`, berkelompok bersama state lain yang sejenis:

```javascript
// Performance — Sidebar
const [performanceDropdownOpen, setPerformanceDropdownOpen] = useState(false);

// Performance — Year Selectors
const [targetYear, setTargetYear] = useState(new Date().getFullYear());
const [realisasiYear, setRealisasiYear] = useState(new Date().getFullYear());

// Performance — Data
const [performanceTargets, setPerformanceTargets] = useState([]); // array of {jenis_project, target_revenue, target_project}
const [performanceRealizations, setPerformanceRealizations] = useState(null); // {targets:[], realizations:[]}
const [realizationList, setRealizationList] = useState([]); // daftar individual

// Performance — Target Form
// Diinisialisasi dengan 5 baris kosong
const JENIS_PROJECT_LIST = ['CFD', 'FEA', 'Engineering Package', 'Process Simulation', 'Other'];
const defaultTargetForm = () => JENIS_PROJECT_LIST.map(j => ({
  jenis_project: j,
  target_revenue: '0',  // string untuk input, dikonversi saat save
  target_project: '0'
}));
const [targetForm, setTargetForm] = useState(defaultTargetForm());
const [targetFormErrors, setTargetFormErrors] = useState({}); // { 'CFD_revenue': 'Nilai tidak boleh negatif' }
const [targetSaving, setTargetSaving] = useState(false);

// Performance — Realisasi Modal
const [addRealisasiModalOpen, setAddRealisasiModalOpen] = useState(false);
const [editRealisasiModalOpen, setEditRealisasiModalOpen] = useState(false);
const [editRealisasiData, setEditRealisasiData] = useState(null); // { id, jenis_project, ... }
const [realisasiForm, setRealisasiForm] = useState({
  jenis_project: '',
  nama_project: '',
  nilai_revenue: '',
  tanggal_selesai: ''
});
const [realisasiFormErrors, setRealisasiFormErrors] = useState({});
const [realisasiSaving, setRealisasiSaving] = useState(false);
```

### 3.5 Frontend — Fungsi Helper Baru di `App.jsx`

Tambahkan fungsi-fungsi ini di blok "Helpers" yang sudah ada (berdekatan dengan `formatRpShort`):

```javascript
// Format revenue: rb/jt/M
const formatRevenue = (value) => {
  const num = parseFloat(value) || 0;
  if (num === 0) return 'Rp 0';
  if (num < 1_000_000) return `Rp ${Math.round(num / 1000)} rb`;
  if (num < 1_000_000_000) return `Rp ${(num / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  return `Rp ${(num / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
};

// Konversi miliar rupiah (input Target) → rupiah penuh
const convertTargetToRupiah = (miliar) => {
  return (parseFloat(miliar) || 0) * 1_000_000_000;
};

// Hitung persentase pencapaian; null jika target=0
const calcPersen = (realisasi, target) => {
  const t = parseFloat(target) || 0;
  const r = parseFloat(realisasi) || 0;
  if (t === 0) return null;
  return parseFloat(((r / t) * 100).toFixed(1));
};

// Hitung sisa target (bisa negatif)
const calcSisa = (target, realisasi) => {
  return (parseFloat(target) || 0) - (parseFloat(realisasi) || 0);
};

// Label status berdasarkan persen
const getStatusLabel = (persen) => {
  if (persen === null) return { text: '-', color: 'var(--text-muted)' };
  if (persen >= 70) return { text: 'Di jalur', color: 'var(--accent-green)' };
  if (persen >= 50) return { text: 'Perlu dorong', color: '#f59e0b' };
  return { text: 'Tertinggal', color: 'var(--accent-red)' };
};
```

### 3.6 Frontend — Fungsi Fetch Data Baru di `App.jsx`

```javascript
const fetchPerformanceTargets = async (tahun) => {
  try {
    const data = await api.getPerformanceTargets(tahun);
    // Gabungkan dengan JENIS_PROJECT_LIST agar selalu 5 baris
    const merged = JENIS_PROJECT_LIST.map(j => {
      const found = data.find(d => d.jenis_project === j);
      return found || { jenis_project: j, target_revenue: 0, target_project: 0 };
    });
    setPerformanceTargets(merged);
    // Populate targetForm
    setTargetForm(merged.map(t => ({
      jenis_project: t.jenis_project,
      target_revenue: String(t.target_revenue),
      target_project: String(t.target_project)
    })));
  } catch (err) {
    console.error(err);
  }
};

const fetchPerformanceRealizations = async (tahun) => {
  try {
    const data = await api.getPerformanceRealizations(tahun);
    setPerformanceRealizations(data);
  } catch (err) {
    console.error(err);
  }
};

const fetchRealizationList = async (tahun) => {
  try {
    const data = await api.getPerformanceRealizationsList(tahun);
    setRealizationList(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
  }
};
```

Di `loadViewData`, tambahkan case baru:

```javascript
case 'performance-target':
  fetchPerformanceTargets(targetYear);
  break;
case 'performance-realisasi':
  fetchPerformanceRealizations(realisasiYear);
  fetchRealizationList(realisasiYear);
  break;
```

### 3.7 Frontend — Sidebar

Di `<ul className="sidebar-menu">`, tambahkan `<li>` baru tepat setelah blok `marketingDropdownOpen`:

```jsx
<li>
  <div
    className={`sidebar-item ${['performance-target','performance-realisasi'].includes(currentView) ? 'active' : ''}`}
    style={{ justifyContent: 'space-between', cursor: 'pointer' }}
    onClick={() => setPerformanceDropdownOpen(!performanceDropdownOpen)}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <Target size={20} />
      <span>Performance</span>
    </div>
    {performanceDropdownOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
  </div>

  {performanceDropdownOpen && (
    <ul style={{ listStyle: 'none', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
      <li>
        <a
          className={`sidebar-item ${currentView === 'performance-target' ? 'active' : ''}`}
          style={{ fontSize: '13px', padding: '8px 12px' }}
          onClick={() => { setCurrentView('performance-target'); setSidebarOpen(false); }}
        >
          <Target size={16} />
          <span>Target</span>
        </a>
      </li>
      <li>
        <a
          className={`sidebar-item ${currentView === 'performance-realisasi' ? 'active' : ''}`}
          style={{ fontSize: '13px', padding: '8px 12px' }}
          onClick={() => { setCurrentView('performance-realisasi'); setSidebarOpen(false); }}
        >
          <TrendingUp size={16} />
          <span>Realisasi</span>
        </a>
      </li>
    </ul>
  )}
</li>
```

> `Target` dan `TrendingUp` harus ditambahkan ke import `lucide-react` jika belum ada. `TrendingUp` kemungkinan belum diimport — periksa baris import di atas `App.jsx`.

### 3.8 Frontend — View `performance-target`

Struktur JSX di dalam `<div className="content-body">`:

```
{currentView === 'performance-target' && (
  <>
    {/* Header + Year Selector */}
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
      <div>
        <h2>Target Kinerja</h2>
        <span>Tetapkan target revenue dan jumlah project per jenis untuk tahun yang dipilih</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <select className="form-select" value={targetYear} onChange={e => {
          const y = parseInt(e.target.value);
          setTargetYear(y);
          fetchPerformanceTargets(y);
        }}>
          {/* Range tahun: tahun berjalan -2 hingga +2 */}
          {[-2,-1,0,1,2].map(offset => {
            const y = new Date().getFullYear() + offset;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
        {user?.role === 'Superadmin' && (
          <button className="btn btn-primary" onClick={saveTargets} disabled={Object.keys(targetFormErrors).length > 0 || targetSaving}>
            {targetSaving ? 'Menyimpan...' : 'Simpan target'}
          </button>
        )}
      </div>
    </div>

    {/* Dua Kartu Berdampingan */}
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
      {/* Kartu Target Revenue */}
      <div className="glass-panel">
        <h3>Target Revenue</h3>
        <table style={{ width:'100%' }}>
          <thead><tr><th>Jenis Project</th><th>Target (M Rp)</th></tr></thead>
          <tbody>
            {targetForm.map((row, idx) => (
              <tr key={row.jenis_project}>
                <td>{row.jenis_project}</td>
                <td>
                  {user?.role === 'Superadmin' ? (
                    <>
                      <input
                        type="number" min="0" step="0.01"
                        className="form-input"
                        value={row.target_revenue}
                        onChange={e => updateTargetFormRow(idx, 'target_revenue', e.target.value)}
                      />
                      <span style={{marginLeft:'4px', fontSize:'12px', color:'var(--text-muted)'}}>M</span>
                      {targetFormErrors[`${row.jenis_project}_revenue`] && (
                        <div style={{color:'var(--accent-red)', fontSize:'11px'}}>
                          {targetFormErrors[`${row.jenis_project}_revenue`]}
                        </div>
                      )}
                    </>
                  ) : (
                    <span>{row.target_revenue} M</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Total</strong></td>
              <td><strong>{targetForm.reduce((s,r) => s + (parseFloat(r.target_revenue)||0), 0).toFixed(2)} M</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Kartu Target Project — struktur identik, field: target_project (integer, tidak ada satuan "M") */}
      ...
    </div>
  </>
)}
```

**Fungsi validasi dan save:**

```javascript
const updateTargetFormRow = (idx, field, value) => {
  const updated = [...targetForm];
  updated[idx] = { ...updated[idx], [field]: value };
  setTargetForm(updated);

  // Validasi inline
  const errors = { ...targetFormErrors };
  const errorKey = `${updated[idx].jenis_project}_${field === 'target_revenue' ? 'revenue' : 'project'}`;
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) {
    errors[errorKey] = 'Nilai tidak boleh negatif atau kosong.';
  } else {
    delete errors[errorKey];
  }
  setTargetFormErrors(errors);
};

const saveTargets = async () => {
  if (Object.keys(targetFormErrors).length > 0) return;
  setTargetSaving(true);
  try {
    await api.savePerformanceTargets(targetYear, targetForm.map(r => ({
      jenis_project: r.jenis_project,
      target_revenue: parseFloat(r.target_revenue) || 0,
      target_project: parseInt(r.target_project) || 0
    })));
    showAlert('Target berhasil disimpan.', 'Sukses', 'success');
  } catch (err) {
    showAlert(err.message, 'Gagal', 'error');
  } finally {
    setTargetSaving(false);
  }
};
```

### 3.9 Frontend — View `performance-realisasi`

Layout utama:

```
Header:
  - Judul "Realisasi Kinerja"
  - Selektor Tahun (realisasiYear)
  - Tombol "+ Tambah realisasi" (hanya Superadmin)

Dua Kartu (grid 1fr 1fr):
  Kartu Realisasi Revenue:
    [Bagian Atas — Ringkasan Total]
    - Total realisasi revenue (formatRevenue)
    - Total target revenue (formatRevenue, setelah konversi ×1_000_000_000)
    - Bar progres (lebar = Math.min(persen, 100)%)
    - Persen Tercapai (calcPersen) atau "-"
    - Sisa Target (calcSisa, formatRevenue) atau "-"
    [Bagian Bawah — Per Jenis Project]
    - 5 baris: nama | formatRevenue(real) dari formatRevenue(target) | bar | label status

  Kartu Realisasi Project:
    [Struktur identik, nilai integer, format "X dari Y project"]

Tabel Riwayat Realisasi:
  Kolom: No | Nama Project | Jenis Project | Nilai Revenue | Tanggal Selesai | Sumber | Aksi
  - Sumber: badge "Kanban" (biru) / "Manual" (abu-abu)
  - Aksi (edit, hapus): hanya Superadmin
```

**Logika render kartu ringkasan** (contoh kartu revenue):

```javascript
// Di dalam JSX view performance-realisasi
const getRevenueData = () => {
  if (!performanceRealizations) return null;
  const { targets, realizations } = performanceRealizations;

  const totalTargetMiliar = targets.reduce((s, t) => s + (parseFloat(t.target_revenue) || 0), 0);
  const totalTargetRupiah = convertTargetToRupiah(totalTargetMiliar);
  const totalReal = realizations.reduce((s, r) => s + (parseFloat(r.total_revenue) || 0), 0);
  const persen = calcPersen(totalReal, totalTargetRupiah);
  const sisa = calcSisa(totalTargetRupiah, totalReal);

  const rows = JENIS_PROJECT_LIST.map(j => {
    const t = targets.find(x => x.jenis_project === j);
    const r = realizations.find(x => x.jenis_project === j);
    const targetRupiah = convertTargetToRupiah(t?.target_revenue || 0);
    const realRupiah = parseFloat(r?.total_revenue || 0);
    const p = calcPersen(realRupiah, targetRupiah);
    return { jenis: j, real: realRupiah, target: targetRupiah, persen: p };
  });

  return { totalTargetRupiah, totalReal, persen, sisa, rows };
};
```

### 3.10 Frontend — Modifikasi Modal Edit Kanban (`fuEditModalOpen`)

Di dalam form `saveFuProspectEdit`, setelah blok "Catatan", tambahkan:

```jsx
{/* --- Field Baru: Jenis Project & Nilai Revenue --- */}
<div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '6px' }}>
  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.8px', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
    Data Kinerja Project
  </span>
  <div className="form-row">
    <div className="form-group" style={{ flex: 1 }}>
      <label className="form-label">Jenis Project</label>
      <select
        className="form-select"
        value={fuEditForm.jenis_project || ''}
        onChange={e => setFuEditForm({ ...fuEditForm, jenis_project: e.target.value })}
      >
        <option value="">-- Belum Dipilih --</option>
        {JENIS_PROJECT_LIST.map(j => <option key={j} value={j}>{j}</option>)}
      </select>
    </div>
    <div className="form-group" style={{ flex: 1 }}>
      <label className="form-label">Nilai Revenue (Rp penuh)</label>
      <input
        type="number"
        min="0"
        className="form-input"
        placeholder="e.g. 2500000000"
        value={fuEditForm.nilai_revenue || ''}
        onChange={e => setFuEditForm({ ...fuEditForm, nilai_revenue: e.target.value })}
      />
    </div>
  </div>
</div>
```

`fuEditForm` perlu diperluas dengan dua field baru. Di `openFuEditModal`:

```javascript
setFuEditForm({
  // ... field yang sudah ada ...
  jenis_project: lead.jenis_project || '',
  nilai_revenue: lead.nilai_revenue || ''
});
```

Di `saveFuProspectEdit`, sertakan dalam payload ke `api.updateProject`:

```javascript
await api.updateProject(fuEditForm.id, {
  // ... field yang sudah ada ...
  jenis_project: fuEditForm.jenis_project || null,
  nilai_revenue: fuEditForm.nilai_revenue ? parseFloat(fuEditForm.nilai_revenue) : null
});
```

Jika backend mengembalikan `warning` (jenis_project kosong saat status Done), tampilkan ke user:

```javascript
const result = await api.updateProject(...);
if (result.warning) {
  showAlert(result.warning, 'Perhatian', 'warning');
}
```

### 3.11 Frontend — Modal Tambah/Edit Realisasi

Modal `addRealisasiModalOpen` dan `editRealisasiModalOpen` menggunakan form yang sama (`realisasiForm` state):

```
Field:
  - Jenis Project: dropdown wajib (JENIS_PROJECT_LIST)
  - Nama Project: text input wajib
  - Nilai Revenue: number input ≥ 0, wajib (rupiah penuh)
  - Tanggal Selesai: date input wajib

Validasi:
  - Jenis Project kosong → error
  - Nilai Revenue < 0 → error

Save logic:
  - Jika addRealisasiModalOpen: api.addPerformanceRealization(realisasiForm)
  - Jika editRealisasiModalOpen: api.updatePerformanceRealization(editRealisasiData.id, realisasiForm)
  - Setelah sukses: tutup modal, showAlert, fetchPerformanceRealizations, fetchRealizationList
```

### 3.12 Frontend — `services/api.js` (Method Baru)

Tambahkan ke objek `api`:

```javascript
// Performance Tracking
getPerformanceTargets: async (tahun) => {
  const res = await fetch(`${API_BASE_URL}/performance/targets?tahun=${tahun}`, {
    headers: getHeaders()
  });
  return handleResponse(res);
},

savePerformanceTargets: async (tahun, targets) => {
  const res = await fetch(`${API_BASE_URL}/performance/targets`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ tahun, targets })
  });
  return handleResponse(res);
},

getPerformanceRealizations: async (tahun) => {
  const res = await fetch(`${API_BASE_URL}/performance/realizations?tahun=${tahun}`, {
    headers: getHeaders()
  });
  return handleResponse(res);
},

getPerformanceRealizationsList: async (tahun) => {
  const res = await fetch(`${API_BASE_URL}/performance/realizations/list?tahun=${tahun}`, {
    headers: getHeaders()
  });
  return handleResponse(res);
},

addPerformanceRealization: async (data) => {
  const res = await fetch(`${API_BASE_URL}/performance/realizations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
},

updatePerformanceRealization: async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/performance/realizations/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
},

deletePerformanceRealization: async (id) => {
  const res = await fetch(`${API_BASE_URL}/performance/realizations/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
},
```

---

## Data Models

### 4.1 DDL — Tabel Baru

```sql
-- Tabel target kinerja per tahun dan jenis project
CREATE TABLE IF NOT EXISTS performance_targets (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  tahun           INT NOT NULL,
  jenis_project   VARCHAR(100) NOT NULL,
  target_revenue  DECIMAL(15, 4) NOT NULL DEFAULT 0,   -- satuan: miliar rupiah
  target_project  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tahun_jenis (tahun, jenis_project)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel catatan realisasi individual
CREATE TABLE IF NOT EXISTS performance_realizations (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  tahun           INT NOT NULL,
  jenis_project   VARCHAR(100) NOT NULL,
  nama_project    VARCHAR(255) NOT NULL,
  nilai_revenue   DECIMAL(20, 2) NOT NULL DEFAULT 0,   -- satuan: rupiah penuh
  tanggal_selesai DATE NOT NULL,
  sumber          ENUM('manual', 'kanban') NOT NULL DEFAULT 'manual',
  kanban_card_id  VARCHAR(100) NULL,                   -- VARCHAR karena no_project adalah string
  dibuat_oleh     INT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tahun_jenis (tahun, jenis_project),
  INDEX idx_kanban_card (kanban_card_id),
  FOREIGN KEY (dibuat_oleh) REFERENCES User(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.2 DDL — Kolom Baru di Tabel `Prospect`

```sql
ALTER TABLE Prospect
  ADD COLUMN jenis_project VARCHAR(100) NULL AFTER nilai_revenue,
  ADD COLUMN nilai_revenue DECIMAL(20, 2) NULL;
```

> **Urutan aman:** Jalankan kedua ALTER ini di environment development terlebih dahulu. Karena MySQL tidak mendukung `ADD COLUMN IF NOT EXISTS` secara portabel, developer harus memastikan kolom belum ada sebelum menjalankan.

Alternatif via `initializeDatabase()` di `config/db.js`:

```javascript
// Di dalam initializeDatabase(), setelah CREATE TABLE IF NOT EXISTS yang sudah ada:
await pool.query(`
  ALTER TABLE Prospect
  ADD COLUMN IF NOT EXISTS jenis_project VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS nilai_revenue DECIMAL(20, 2) NULL
`);
// Catatan: ADD COLUMN IF NOT EXISTS didukung MySQL 8.0+.
// Untuk MySQL < 8.0, gunakan workaround via INFORMATION_SCHEMA.
```

### 4.3 Skema Response API

**`GET /api/performance/targets?tahun=2025`**

```json
[
  { "jenis_project": "CFD",                  "target_revenue": 5.5, "target_project": 10 },
  { "jenis_project": "FEA",                  "target_revenue": 3.0, "target_project": 8 },
  { "jenis_project": "Engineering Package",  "target_revenue": 2.0, "target_project": 5 },
  { "jenis_project": "Process Simulation",   "target_revenue": 1.5, "target_project": 4 },
  { "jenis_project": "Other",                "target_revenue": 1.0, "target_project": 3 }
]
```

**`GET /api/performance/realizations?tahun=2025`**

```json
{
  "targets": [
    { "jenis_project": "CFD", "target_revenue": 5.5, "target_project": 10 },
    ...
  ],
  "realizations": [
    { "jenis_project": "CFD", "total_revenue": 3800000000, "total_project": 7 },
    { "jenis_project": "FEA", "total_revenue": 1500000000, "total_project": 4 },
    { "jenis_project": "Engineering Package", "total_revenue": 0, "total_project": 0 },
    { "jenis_project": "Process Simulation",  "total_revenue": 0, "total_project": 0 },
    { "jenis_project": "Other", "total_revenue": 500000000, "total_project": 1 }
  ]
}
```

> Backend harus memastikan semua 5 jenis project selalu muncul di `realizations`, termasuk yang nilainya 0 (LEFT JOIN atau merge di aplikasi level).

**`GET /api/performance/realizations/list?tahun=2025`**

```json
[
  {
    "id": 1,
    "jenis_project": "CFD",
    "nama_project": "14. CFD Hull Simulation - PT XYZ",
    "nilai_revenue": 2500000000,
    "tanggal_selesai": "2025-06-15",
    "sumber": "kanban",
    "kanban_card_id": "14.IMX-2025-06-10"
  },
  ...
]
```

### 4.4 Query Backend Kunci

**UPSERT target (loop per jenis):**

```javascript
for (const row of targets) {
  await pool.query(`
    INSERT INTO performance_targets (tahun, jenis_project, target_revenue, target_project)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      target_revenue = VALUES(target_revenue),
      target_project = VALUES(target_project),
      updated_at = NOW()
  `, [tahun, row.jenis_project, row.target_revenue, row.target_project]);
}
```

**Agregasi realisasi per jenis + LEFT JOIN semua 5 jenis:**

```javascript
// Strategi: ambil data yang ada, merge di JavaScript dengan JENIS_PROJECT_LIST
const [rows] = await pool.query(`
  SELECT jenis_project,
         SUM(nilai_revenue) AS total_revenue,
         COUNT(*)           AS total_project
  FROM performance_realizations
  WHERE tahun = ?
  GROUP BY jenis_project
`, [tahun]);

const VALID_JENIS = ['CFD', 'FEA', 'Engineering Package', 'Process Simulation', 'Other'];
const realizations = VALID_JENIS.map(j => {
  const found = rows.find(r => r.jenis_project === j);
  return {
    jenis_project: j,
    total_revenue: found ? parseFloat(found.total_revenue) : 0,
    total_project: found ? parseInt(found.total_project) : 0
  };
});
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


Dari hasil prework, beberapa properti yang awalnya terpisah dapat digabung:
- Label status (Di jalur / Perlu dorong / Tertinggal) untuk tiga range → digabung menjadi satu property yang mencakup semua threshold sekaligus
- Format revenue (rb/jt/M) untuk tiga threshold → digabung menjadi satu property format

### Property 1: Konversi Satuan Target ke Rupiah Penuh

*Untuk semua nilai x ≥ 0, fungsi `convertTargetToRupiah(x)` harus menghasilkan tepat `x * 1_000_000_000`.*

Properti ini memvalidasi bahwa perbandingan antara `target_revenue` (disimpan dalam miliar) dan `nilai_revenue` realisasi (disimpan dalam rupiah penuh) selalu konsisten. Kesalahan konversi akan membuat semua kalkulasi persen dan sisa menjadi salah.

**Validates: Requirements 14.6, 2.1, 3.1**

---

### Property 2: Kalkulasi Persen Pencapaian

*Untuk semua nilai target t dan realisasi r di mana t = 0, `calcPersen(r, t)` harus mengembalikan `null`. Untuk semua t > 0 dan r ≥ 0, `calcPersen(r, t)` harus mengembalikan `parseFloat(((r / t) * 100).toFixed(1))`.*

Properti ini memvalidasi bahwa: (a) pembagian dengan nol tidak terjadi, (b) rumus persen secara matematis benar, (c) pembulatan ke 1 desimal konsisten.

**Validates: Requirements 7.2, 7.3, 14.2, 14.3**

---

### Property 3: Bar Progres Tidak Pernah Melebihi 100%

*Untuk semua nilai realisasi r ≥ 0 dan target t > 0, ekspresi `Math.min(calcPersen(r, t), 100)` harus selalu menghasilkan nilai yang ≤ 100.*

Properti ini memvalidasi bahwa bar progres tidak pernah meluap keluar container, bahkan saat realisasi melampaui target.

**Validates: Requirements 7.4, 8.6, 14.5**

---

### Property 4: Label Status Konsisten dengan Threshold

*Untuk semua nilai persen p ≥ 0: jika p ≥ 70 maka `getStatusLabel(p).text === 'Di jalur'`; jika 50 ≤ p < 70 maka `getStatusLabel(p).text === 'Perlu dorong'`; jika p < 50 maka `getStatusLabel(p).text === 'Tertinggal'`. Untuk input `null`, `getStatusLabel(null).text === '-'`.*

Properti ini memvalidasi bahwa tidak ada overlap atau gap dalam threshold, dan bahwa setiap nilai persen yang mungkin jatuh ke tepat satu kategori.

**Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.7**

---

### Property 5: Format Revenue Menggunakan Threshold yang Tepat

*Untuk semua nilai v ≥ 0: jika v < 1_000_000 maka `formatRevenue(v)` mengandung 'rb'; jika 1_000_000 ≤ v < 1_000_000_000 maka mengandung 'jt'; jika v ≥ 1_000_000_000 maka mengandung 'M'.*

Properti ini memvalidasi bahwa pembagian format tidak overlap dan tidak ada gap, serta semua angka menggunakan satuan yang tepat.

**Validates: Requirements 7.6, 14.1**

---

### Property 6: Idempoten Penyimpanan Target (UPSERT)

*Untuk semua kombinasi (tahun, jenis_project, nilai), menyimpan target yang sama dua kali berturut-turut harus menghasilkan tepat satu baris di tabel `performance_targets` dengan nilai yang sama dengan penyimpanan terakhir.*

Properti ini memvalidasi bahwa operasi UPSERT tidak menciptakan duplikat dan selalu menggunakan nilai terbaru.

**Validates: Requirements 2.4, 12.2**

---

### Property 7: Idempoten Trigger Realisasi Kanban

*Untuk semua kartu Prospect dengan `kanban_card_id` tertentu yang memiliki `jenis_project` valid, mengubah status ke 'Done' sebanyak apapun harus menghasilkan tepat satu baris di `performance_realizations` dengan `kanban_card_id` tersebut.*

Properti ini memvalidasi bahwa trigger tidak membuat duplikat catatan realisasi jika status 'Done' diatur ulang ke nilai lain lalu ke 'Done' kembali.

**Validates: Requirements 10.4**

---

## Error Handling

### 5.1 Backend — Validasi Input

| Skenario | Status | Respons |
|---|---|---|
| `target_revenue` atau `target_project` negatif | 400 | `{ message: 'Nilai target tidak boleh negatif.' }` |
| `jenis_project` tidak valid | 400 | `{ message: 'Jenis project tidak valid. Pilihan: CFD, FEA, Engineering Package, Process Simulation, Other.' }` |
| `nilai_revenue` negatif | 400 | `{ message: 'Nilai revenue tidak boleh negatif.' }` |
| `tanggal_selesai` bukan tanggal valid | 400 | `{ message: 'Format tanggal selesai tidak valid.' }` |
| Token tidak ada | 401 | `{ message: 'Akses ditolak: Token otentikasi tidak ditemukan.' }` |
| Role bukan Superadmin pada endpoint write | 403 | `{ message: 'Akses ditolak: Anda tidak memiliki wewenang untuk melakukan aksi ini.' }` |
| ID realisasi tidak ditemukan (PUT/DELETE) | 404 | `{ message: 'Catatan realisasi tidak ditemukan.' }` |
| Database error | 500 | `{ message: 'Gagal menyimpan data.' }` |

### 5.2 Backend — Trigger Realisasi Otomatis

| Skenario | Perilaku |
|---|---|
| Status berubah ke Done, `jenis_project` valid, belum ada realisasi | Buat realisasi baru — lanjutkan update Prospect |
| Status berubah ke Done, `jenis_project` kosong/null | Kembalikan `{ message, warning }` — tetap update Prospect, tidak buat realisasi |
| Status berubah ke Done, `kanban_card_id` sudah ada di realisasi | Lewati pembuatan — lanjutkan update Prospect diam-diam |
| INSERT realisasi gagal (DB error) | Log error, tetap kembalikan sukses untuk update Prospect — jangan blokir perubahan status |

Prinsip penting: **kegagalan trigger realisasi tidak boleh memblokir perubahan status kartu**. Perubahan status adalah operasi utama; realisasi adalah efek samping.

### 5.3 Frontend — Penanganan Error

| Skenario | Penanganan |
|---|---|
| Fetch data gagal (network/API error) | `console.error`, state tetap kosong/default, tidak crash |
| Save target gagal | `showAlert(err.message, 'Gagal', 'error')` |
| Save realisasi manual gagal | `showAlert(err.message, 'Gagal', 'error')` |
| Backend mengembalikan `warning` saat update kartu Kanban | `showAlert(warning, 'Perhatian', 'warning')` |
| Input negatif di form Target | Error inline di samping field, tombol Simpan disabled |
| Input negatif di form Realisasi | Error inline, tombol simpan modal disabled |

### 5.4 Responsivitas (≤768px)

- Kartu Target dan Realisasi menggunakan `gridTemplateColumns: '1fr 1fr'` pada layar lebar, diubah ke `'1fr'` via media query inline:
  ```javascript
  style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: '20px' }}
  ```
  Atau gunakan class CSS yang sudah ada jika tersedia.
- Tabel riwayat realisasi dibungkus `<div className="table-container">` yang sudah memiliki `overflow-x: auto`.

---

## Testing Strategy

### 6.1 Pendekatan Dual Testing

Fitur ini menggunakan dua lapisan pengujian:
- **Unit tests** (example-based): verifikasi skenario spesifik, edge case, dan integrasi komponen
- **Property tests** (property-based): verifikasi fungsi helper murni untuk semua input yang mungkin

### 6.2 Property-Based Testing

Library yang direkomendasikan: **[fast-check](https://fast-check.dev/)** (JavaScript/TypeScript).

Setiap property test harus dijalankan minimum **100 iterasi**.

**Konfigurasi tag per test:**

```javascript
// Tag format: Feature: performance-tracking, Property {N}: {deskripsi singkat}
test('Property 1: convertTargetToRupiah', () => {
  // Feature: performance-tracking, Property 1: konversi satuan miliar ke rupiah penuh
  fc.assert(fc.property(
    fc.float({ min: 0, max: 999.999, noNaN: true }),
    (x) => {
      expect(convertTargetToRupiah(x)).toBe(x * 1_000_000_000);
    }
  ), { numRuns: 100 });
});
```

**Ringkasan property tests yang perlu diimplementasi:**

| Property | Generator Input | Assertion |
|---|---|---|
| P1: convertTargetToRupiah | `fc.float({ min: 0 })` | `result === x * 1e9` |
| P2: calcPersen — t=0 | `fc.float({ min: 0 }), fc.constant(0)` | `result === null` |
| P2: calcPersen — t>0 | `fc.float({min:0}), fc.float({min:0.01})` | `result === parseFloat(((r/t)*100).toFixed(1))` |
| P3: bar cap 100 | `fc.float({min:0}), fc.float({min:0.01})` | `Math.min(calcPersen(r,t), 100) <= 100` |
| P4: getStatusLabel thresholds | `fc.float({min:0, max:200})` | branch sesuai range persen |
| P5: formatRevenue thresholds | `fc.float({min:0})` | mengandung 'rb'/'jt'/'M' sesuai magnitude |

### 6.3 Unit Tests (Example-Based)

**Backend (`routes/performance.js`):**

```
- GET /targets: kembalikan array 5 elemen untuk tahun yang ada
- GET /targets: kembalikan array kosong (atau default 0) untuk tahun tanpa data
- POST /targets: simpan 5 target, verifikasi COUNT(*) === 5
- POST /targets: UPSERT — simpan ulang target yang sama, COUNT tetap 5
- POST /targets: tolak jika target_revenue negatif (400)
- POST /targets: tolak jika jenis_project tidak valid (400)
- POST /targets: tolak jika bukan Superadmin (403)
- POST /realizations: simpan realisasi manual, verifikasi sumber='manual'
- POST /realizations: tolak nilai_revenue negatif (400)
- DELETE /realizations/:id: hapus record yang ada, verifikasi tidak ditemukan setelahnya
```

**Backend trigger (`routes/projects.js` PUT /:id):**

```
- Update status ke DONE dengan jenis_project valid → 1 record di performance_realizations
- Update status ke DONE tanpa jenis_project → 0 record, response mengandung 'warning'
- Update status ke DONE dua kali (kanban_card_id duplikat) → tetap 1 record
- Update status ke non-DONE → 0 record dibuat
```

**Frontend (helper functions):**

```
- formatRevenue(0) === 'Rp 0'
- formatRevenue(500000) === 'Rp 500 rb'
- formatRevenue(1500000) === 'Rp 1,5 jt'
- formatRevenue(2500000000) === 'Rp 2,5 M'
- calcPersen(0, 0) === null
- calcPersen(7000000000, 10000000000) === 70.0
- calcSisa(10000000000, 7000000000) === 3000000000
- calcSisa(10000000000, 12000000000) === -2000000000  // negatif, melampaui target
- getStatusLabel(null) → { text: '-' }
- getStatusLabel(70) → { text: 'Di jalur' }
- getStatusLabel(69.9) → { text: 'Perlu dorong' }
- getStatusLabel(49.9) → { text: 'Tertinggal' }
```

**Frontend (UI behavior):**

```
- Input negatif di form Target → error inline muncul, tombol Simpan disabled
- Input 0 valid → tidak ada error
- Selektor tahun berubah → fetchPerformanceTargets dipanggil dengan tahun baru
- Pengguna non-Superadmin → form Target read-only, tombol Simpan tidak tampil
- Pengguna non-Superadmin → tombol "Tambah realisasi" tidak tampil di halaman Realisasi
- Pengguna non-Superadmin → tombol edit/hapus di tabel riwayat tidak tampil
```

### 6.4 Integration Tests

```
- Simpan target → ambil target → nilai konsisten (round-trip)
- Tambah realisasi manual → GET /realizations → total_revenue bertambah
- Update Prospect ke Done → GET /realizations → total_project bertambah
- Uji UNIQUE constraint: dua INSERT dengan (tahun, jenis_project) sama → 1 row di DB
- Uji kanban_card_id uniqueness: trigger dua kali → tetap 1 row di performance_realizations
```
