# Implementation Plan: Performance Tracking

## Overview

Implementasi fitur Performance Tracking mencakup dua tabel database baru, satu file route backend baru, modifikasi tiga file backend/frontend yang sudah ada, dan dua view baru di App.jsx. Urutan task mengikuti dependency: database → backend → frontend API layer → state/helpers → UI views → tests.

---

## Tasks

- [x] 1. Database — Buat tabel dan ALTER kolom baru
  - [x] 1.1 Tambahkan DDL tabel `performance_targets` dan `performance_realizations` ke `backend/config/schema.sql`
    - Tambahkan DDL `CREATE TABLE IF NOT EXISTS performance_targets` dengan kolom: `id`, `tahun`, `jenis_project`, `target_revenue` (DECIMAL, satuan miliar rupiah), `target_project`, `created_at`, `updated_at`, dan UNIQUE KEY `uq_tahun_jenis (tahun, jenis_project)`
    - Tambahkan DDL `CREATE TABLE IF NOT EXISTS performance_realizations` dengan kolom: `id`, `tahun`, `jenis_project`, `nama_project`, `nilai_revenue` (DECIMAL, satuan rupiah penuh), `tanggal_selesai`, `sumber` (ENUM 'manual'/'kanban'), `kanban_card_id` (VARCHAR 100, nullable — bukan INT, karena `Prospect.no_project` adalah string), `dibuat_oleh` (FK ke `User`), `created_at`, `updated_at`; beserta INDEX dan FK ke `User(id) ON DELETE SET NULL`
    - _Requirements: 2.1, 2.2, 3.1_

  - [x] 1.2 Tambahkan ALTER TABLE Prospect ke blok idempotent di `backend/config/db.js`
    - Di dalam array `alterStatements` di fungsi `initializeDatabase()`, tambahkan dua entry: `"ALTER TABLE Prospect ADD COLUMN IF NOT EXISTS jenis_project VARCHAR(100) NULL"` dan `"ALTER TABLE Prospect ADD COLUMN IF NOT EXISTS nilai_revenue DECIMAL(20,2) NULL"`
    - Gunakan `ADD COLUMN IF NOT EXISTS` (MySQL 8+) agar idempotent; tempatkan di dalam blok `try/catch` yang sudah ada
    - _Requirements: 4.1, 4.2_

- [x] 2. Backend — Buat `routes/performance.js`
  - [x] 2.1 Buat file `backend/routes/performance.js` dengan konstanta, middleware, dan endpoint GET targets
    - Buat file CommonJS baru; require `express`, `pool` dari `../config/db`, `verifyToken` dan `requireRole` dari `../middleware/auth`
    - Definisikan `const VALID_JENIS = ['CFD', 'FEA', 'Engineering Package', 'Process Simulation', 'Other']`
    - Implementasikan `GET /targets?tahun=YYYY`: validasi query param `tahun`, query `SELECT` dari `performance_targets WHERE tahun = ?`, merge result dengan `VALID_JENIS` agar selalu mengembalikan 5 elemen (jenis yang belum ada di DB dikembalikan dengan nilai 0)
    - _Requirements: 12.1_

  - [x] 2.2 Tambahkan endpoint POST /targets ke `routes/performance.js`
    - `POST /targets`: gunakan middleware `verifyToken` + `requireRole(['Superadmin'])`, validasi body `{ tahun, targets[] }` — tolak 400 jika `target_revenue < 0` atau `target_project < 0` atau `jenis_project` tidak ada di `VALID_JENIS`, tolak 403 jika bukan Superadmin
    - Implementasikan loop UPSERT: `INSERT INTO performance_targets (...) VALUES (?) ON DUPLICATE KEY UPDATE target_revenue = VALUES(target_revenue), target_project = VALUES(target_project), updated_at = NOW()`
    - _Requirements: 2.3, 2.4, 12.2, 12.3, 12.4_

  - [x] 2.3 Tambahkan endpoint GET realizations dan GET realizations/list ke `routes/performance.js`
    - `GET /realizations?tahun=YYYY`: query `SELECT ... FROM performance_targets WHERE tahun = ?` untuk targets, query `SELECT jenis_project, SUM(nilai_revenue) AS total_revenue, COUNT(*) AS total_project FROM performance_realizations WHERE tahun = ? GROUP BY jenis_project` untuk realizations; merge keduanya dengan `VALID_JENIS` menggunakan JavaScript agar selalu 5 elemen dengan nilai 0 untuk yang kosong; kembalikan `{ targets, realizations }`
    - `GET /realizations/list?tahun=YYYY`: query SELECT semua kolom individual (`id, jenis_project, nama_project, nilai_revenue, tanggal_selesai, sumber, kanban_card_id`) dari `performance_realizations WHERE tahun = ?` ORDER BY `tanggal_selesai DESC`
    - _Requirements: 13.1, 13.6_

  - [x] 2.4 Tambahkan endpoint POST, PUT, DELETE realizations ke `routes/performance.js`
    - `POST /realizations`: `verifyToken` + `requireRole(['Superadmin'])`; validasi `jenis_project` ada di `VALID_JENIS`, `nilai_revenue >= 0`, `tanggal_selesai` adalah date valid; hitung `tahun` dari `tanggal_selesai`; INSERT dengan `sumber = 'manual'`, `kanban_card_id = NULL`, `dibuat_oleh = req.user.id`; kembalikan 201 `{ message, id }`
    - `PUT /realizations/:id`: `verifyToken` + `requireRole(['Superadmin'])`; validasi sama dengan POST; UPDATE baris berdasarkan `:id`; kembalikan 404 jika tidak ditemukan
    - `DELETE /realizations/:id`: `verifyToken` + `requireRole(['Superadmin'])`; DELETE berdasarkan `:id`; kembalikan 404 jika tidak ditemukan
    - `module.exports = router` di akhir file
    - _Requirements: 5.2, 5.5, 13.2, 13.3, 13.4, 13.7, 13.8, 13.9, 13.10_

- [x] 3. Backend — Modifikasi `routes/projects.js` (PUT /:id)
  - [x] 3.1 Perluas UPDATE Prospect di `PUT /:id` untuk menyimpan `jenis_project` dan `nilai_revenue`
    - Di dalam handler `PUT /:id`, sebelum query `UPDATE Prospect SET ...`, tambahkan dua variabel: `final_jenis_project` (dari `req.body.jenis_project !== undefined ? req.body.jenis_project : current.jenis_project`) dan `final_nilai_revenue` (dari `req.body.nilai_revenue !== undefined ? parseFloat(req.body.nilai_revenue) || null : current.nilai_revenue`)
    - Perluas query `UPDATE Prospect SET` yang sudah ada untuk menyertakan kolom `jenis_project = ?` dan `nilai_revenue = ?` dengan nilai `final_jenis_project || null` dan `final_nilai_revenue`
    - _Requirements: 4b.3, 4b.4_

  - [x] 3.2 Tambahkan trigger realisasi otomatis di `PUT /:id` setelah UPDATE Prospect
    - Setelah query UPDATE Prospect berhasil, tambahkan blok: cek `final_status.toUpperCase() === 'DONE'`
    - Jika status DONE dan `final_jenis_project` kosong/null: kembalikan `res.json({ message: 'Proyek berhasil diperbarui.', warning: 'Realisasi tidak dicatat otomatis karena jenis project belum diisi.' })` — tetap status 200, tidak blokir update
    - Jika status DONE dan `final_jenis_project` valid: cek `SELECT id FROM performance_realizations WHERE kanban_card_id = ?` dengan nilai `id` (no_project); jika belum ada, INSERT baru dengan `sumber = 'kanban'`, `tanggal_selesai = today`, `tahun = new Date().getFullYear()`, `kanban_card_id = id` (string no_project), `dibuat_oleh = req.user.id`; jika sudah ada, lewati diam-diam
    - Jika INSERT realisasi gagal (DB error): log error, tetap lanjutkan dan kembalikan respons sukses — kegagalan trigger tidak boleh memblokir perubahan status kartu
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 4. Backend — Daftarkan route di `server.js`
  - [x] 4.1 Tambahkan satu baris di `backend/server.js` untuk mendaftarkan performance router
    - Di blok "Register Routes" yang sudah ada, tambahkan: `app.use('/api/performance', require('./routes/performance'));`
    - Tempatkan di bawah baris `app.use('/api/notes', ...)` yang sudah ada
    - _Requirements: 13.5_

- [x] 5. Frontend — Tambahkan API methods ke `services/api.js`
  - [x] 5.1 Tambahkan 7 method Performance Tracking ke objek `api` di `frontend/src/services/api.js`
    - Tambahkan method: `getPerformanceTargets(tahun)` → `GET /api/performance/targets?tahun=${tahun}`
    - Tambahkan method: `savePerformanceTargets(tahun, targets)` → `POST /api/performance/targets` dengan body `{ tahun, targets }`
    - Tambahkan method: `getPerformanceRealizations(tahun)` → `GET /api/performance/realizations?tahun=${tahun}`
    - Tambahkan method: `getPerformanceRealizationsList(tahun)` → `GET /api/performance/realizations/list?tahun=${tahun}`
    - Tambahkan method: `addPerformanceRealization(data)` → `POST /api/performance/realizations`
    - Tambahkan method: `updatePerformanceRealization(id, data)` → `PUT /api/performance/realizations/${id}`
    - Tambahkan method: `deletePerformanceRealization(id)` → `DELETE /api/performance/realizations/${id}`
    - Semua method menggunakan `getHeaders()` dan `handleResponse()` yang sudah ada
    - _Requirements: 12.1, 12.2, 13.1, 13.2, 13.6, 13.7, 13.8_

- [ ] 6. Frontend — Tambahkan state, konstanta, dan helper functions ke `App.jsx`
  - [x] 6.1 Tambahkan state variables Performance ke `App.jsx`
    - Di dalam fungsi `App()`, di blok state yang relevan, tambahkan: `performanceDropdownOpen` (false), `targetYear` (getFullYear()), `realisasiYear` (getFullYear()), `performanceTargets` ([]), `performanceRealizations` (null), `realizationList` ([]), `targetForm` (defaultTargetForm()), `targetFormErrors` ({}), `targetSaving` (false), `addRealisasiModalOpen` (false), `editRealisasiModalOpen` (false), `editRealisasiData` (null), `realisasiForm` ({ jenis_project:'', nama_project:'', nilai_revenue:'', tanggal_selesai:'' }), `realisasiFormErrors` ({}), `realisasiSaving` (false)
    - Tambahkan konstanta `JENIS_PROJECT_LIST` dan fungsi `defaultTargetForm` di dalam `App()` di atas state declarations
    - _Requirements: 6.1, 6.2, 9.1_

  - [x] 6.2 Tambahkan helper functions `formatRevenue`, `convertTargetToRupiah`, `calcPersen`, `calcSisa`, `getStatusLabel` ke `App.jsx`
    - `formatRevenue(value)`: if num < 1_000_000 → `Rp X rb`; if num < 1_000_000_000 → `Rp X,X jt`; if num >= 1_000_000_000 → `Rp X,X M`; jika 0 → `Rp 0`; gunakan koma sebagai separator desimal
    - `convertTargetToRupiah(miliar)`: return `(parseFloat(miliar) || 0) * 1_000_000_000`
    - `calcPersen(realisasi, target)`: jika target === 0 return null; return `parseFloat(((r / t) * 100).toFixed(1))`
    - `calcSisa(target, realisasi)`: return target - realisasi (bisa negatif)
    - `getStatusLabel(persen)`: null → `{ text: '-', color: 'var(--text-muted)' }`; >= 70 → `{ text: 'Di jalur', color: 'var(--accent-green)' }`; >= 50 → `{ text: 'Perlu dorong', color: '#f59e0b' }`; < 50 → `{ text: 'Tertinggal', color: 'var(--accent-red)' }`
    - Tempatkan berdekatan dengan helper functions lain yang sudah ada (di sekitar `formatRpShort`)
    - _Requirements: 7.6, 8.2, 8.3, 8.4, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [-] 6.3 Tambahkan fetch functions dan case baru di `loadViewData` di `App.jsx`
    - Tambahkan fungsi `fetchPerformanceTargets(tahun)`: call `api.getPerformanceTargets(tahun)`, merge dengan `JENIS_PROJECT_LIST` untuk selalu 5 baris, set `performanceTargets` dan `targetForm`
    - Tambahkan fungsi `fetchPerformanceRealizations(tahun)`: call `api.getPerformanceRealizations(tahun)`, set `performanceRealizations`
    - Tambahkan fungsi `fetchRealizationList(tahun)`: call `api.getPerformanceRealizationsList(tahun)`, set `realizationList`
    - Di fungsi/switch `loadViewData` (atau ekuivalennya), tambahkan case `'performance-target'` yang memanggil `fetchPerformanceTargets(targetYear)` dan case `'performance-realisasi'` yang memanggil `fetchPerformanceRealizations(realisasiYear)` dan `fetchRealizationList(realisasiYear)`
    - _Requirements: 6.2, 9.2_

- [ ] 7. Frontend — Tambahkan grup sidebar "Performance" ke `App.jsx`
  - [-] 7.1 Tambahkan import `TrendingUp` ke lucide-react dan tambahkan `<li>` sidebar Performance
    - Tambahkan `TrendingUp` ke baris import `from 'lucide-react'` yang sudah ada (cek apakah `Target` sudah ada, jika belum tambahkan juga)
    - Di JSX sidebar, tambahkan `<li>` baru tepat setelah blok `marketingDropdownOpen` yang sudah ada
    - `<li>` berisi: div header yang onClick toggle `performanceDropdownOpen`, menampilkan ikon `Target`, teks "Performance", dan ikon `ChevronRight`/`ChevronDown` kondisional
    - Saat `performanceDropdownOpen === true`: render `<ul>` dengan dua sub-item: "Target" (ikon `Target`, onClick `setCurrentView('performance-target')`) dan "Realisasi" (ikon `TrendingUp`, onClick `setCurrentView('performance-realisasi')`)
    - Terapkan class `active` (pill biru) pada sub-item yang sesuai dengan `currentView`; terapkan class aktif pada header grup jika `currentView` termasuk `'performance-target'` atau `'performance-realisasi'`
    - WHEN `currentView` di-set ke `'performance-target'` atau `'performance-realisasi'` (misalnya via navigasi programatik), set `performanceDropdownOpen` ke `true` menggunakan `useEffect` atau kondisi inline
    - Gunakan style yang sama dengan sub-item grup "Marketing" yang sudah ada
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

- [ ] 8. Frontend — Implementasikan view `performance-target` di `App.jsx`
  - [~] 8.1 Implementasikan fungsi `updateTargetFormRow` dan `saveTargets` di `App.jsx`
    - `updateTargetFormRow(idx, field, value)`: update `targetForm[idx][field]`, lakukan validasi inline — jika nilai negatif atau bukan angka set error di `targetFormErrors[${jenis}_revenue|project]`, jika valid hapus error key tersebut
    - `saveTargets()`: guard jika `targetFormErrors` tidak kosong; set `targetSaving = true`; call `api.savePerformanceTargets(targetYear, ...)` dengan konversi ke number; sukses → `showAlert('Target berhasil disimpan.')`, gagal → `showAlert(err.message, 'Gagal', 'error')`; finally set `targetSaving = false`
    - _Requirements: 6.8, 6.9, 6.10, 6.11_

  - [~] 8.2 Implementasikan JSX view `performance-target` di dalam blok render `App.jsx`
    - Tambahkan blok `{currentView === 'performance-target' && (...)}` di dalam `<div className="content-body">`
    - Header: judul "Target Kinerja", selektor tahun (`targetYear`, range tahun berjalan ±2), tombol "Simpan target" (hanya jika `user?.role === 'Superadmin'`, disabled jika ada `targetFormErrors` atau `targetSaving`)
    - Layout dua kartu berdampingan (`grid-template-columns: 1fr 1fr`, mobile fallback `1fr` untuk `<768px`)
    - Kartu "Target Revenue": tabel dengan kolom "Jenis Project" dan "Target (M Rp)"; setiap baris: `<input type="number" min="0">` untuk Superadmin atau `<span>` read-only untuk non-Superadmin; satuan "M" di samping input; pesan error inline jika `targetFormErrors[...]` ada; baris total di `<tfoot>` dihitung otomatis dari sum targetForm
    - Kartu "Target Project": struktur identik, field `target_project` (integer), tidak ada satuan "M"
    - _Requirements: 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.12, 15.1, 15.2, 15.3, 15.4_

- [ ] 9. Frontend — Implementasikan view `performance-realisasi` dan tabel riwayat di `App.jsx`
  - [~] 9.1 Implementasikan JSX header dan dua kartu ringkasan di view `performance-realisasi`
    - Tambahkan blok `{currentView === 'performance-realisasi' && (...)}` di `<div className="content-body">`
    - Header: judul "Realisasi Kinerja", selektor tahun (`realisasiYear`), tombol "+ Tambah realisasi" (hanya Superadmin)
    - Helper inline `getRevenueData()` dan `getProjectData()` yang menghitung dari `performanceRealizations`: total target (konversi miliar ke rupiah), total realisasi, `persen = calcPersen(...)`, `sisa = calcSisa(...)`, array 5 baris per jenis project
    - Kartu "Realisasi Revenue": bagian atas — total realisasi (`formatRevenue`), total target (`formatRevenue`), bar progres (`Math.min(persen, 100)%`), persen tercapai (angka asli, misal "125,0%" jika melebihi), sisa target (`formatRevenue`, bisa negatif); jika target = 0 tampilkan "-" untuk persen dan sisa
    - Kartu "Realisasi Project": struktur identik, nilai integer, format "X dari Y project"
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 9.1, 14.5, 15.1_

  - [~] 9.2 Implementasikan baris per jenis project di dalam dua kartu realisasi
    - Di bawah ringkasan total dalam setiap kartu, render 5 baris dari array hasil `getRevenueData()`/`getProjectData()`
    - Setiap baris: nama jenis project, bar progres per jenis (`Math.min(persen, 100)%`), teks perbandingan ("Rp X,X M dari Rp X,X M" untuk revenue; "X dari Y project" untuk project), `Label_Status` dari `getStatusLabel(persen)` — warna hijau/kuning/merah atau "-" jika target = 0
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [~] 9.3 Implementasikan tabel riwayat realisasi di bawah kartu di view `performance-realisasi`
    - Render tabel/daftar dengan kolom: No, Nama Project, Jenis Project, Nilai Revenue (`formatRevenue`), Tanggal Selesai, Sumber, Aksi
    - Kolom Sumber: badge "Kanban" (biru) dan "Manual" (abu-abu) menggunakan class CSS yang ada
    - Kolom Aksi: tombol edit (ikon `Edit3`) dan hapus (ikon `Trash2`) — hanya tampil jika `user?.role === 'Superadmin'`
    - Bungkus tabel dalam `<div className="table-container">` untuk `overflow-x: auto` pada mobile
    - onClick edit → set `editRealisasiData` dengan data baris, set `realisasiForm` pre-filled, set `editRealisasiModalOpen = true`
    - onClick hapus → tampilkan `customConfirm`, jika dikonfirmasi call `api.deletePerformanceRealization(id)` lalu reload `fetchPerformanceRealizations` + `fetchRealizationList`
    - _Requirements: 9.2, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7_

- [ ] 10. Frontend — Implementasikan modal tambah/edit realisasi di `App.jsx`
  - [~] 10.1 Implementasikan fungsi `saveRealisasi` dan JSX modal tambah/edit realisasi
    - Fungsi `saveRealisasi()`: validasi `realisasiForm` — `jenis_project` wajib (jika kosong set `realisasiFormErrors.jenis_project`), `nilai_revenue >= 0` wajib, `nama_project` tidak kosong, `tanggal_selesai` tidak kosong; set `realisasiSaving = true`; jika `addRealisasiModalOpen` call `api.addPerformanceRealization(realisasiForm)`; jika `editRealisasiModalOpen` call `api.updatePerformanceRealization(editRealisasiData.id, realisasiForm)`; sukses: tutup modal, `showAlert`, reload data; gagal: `showAlert(err.message, 'Gagal', 'error')`
    - JSX modal: gunakan `modal-overlay` dan `modal-content` class; render form dengan 4 field: dropdown "Jenis Project" (JENIS_PROJECT_LIST + opsi kosong), input teks "Nama Project", input number "Nilai Revenue" (rupiah penuh, min=0), input date "Tanggal Selesai"; pesan error inline per field; tombol "Simpan" (disabled saat saving atau ada errors) dan "Batal"
    - Modal render dua kali: satu untuk `addRealisasiModalOpen` (title "Tambah Realisasi") dan satu untuk `editRealisasiModalOpen` (title "Edit Realisasi")
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 11. Frontend — Modifikasi modal edit kartu Kanban di `App.jsx`
  - [~] 11.1 Tambahkan field "Jenis Project" dan "Nilai Revenue" ke modal edit Kanban
    - Di dalam form modal `fuEditModalOpen` (`saveFuProspectEdit`), tambahkan section baru "Data Kinerja Project" di bawah field "Catatan" yang sudah ada
    - Section berisi: dropdown "Jenis Project" (JENIS_PROJECT_LIST + opsi "-- Belum Dipilih --") terikat ke `fuEditForm.jenis_project`; input number "Nilai Revenue (Rp penuh)" (min=0) terikat ke `fuEditForm.nilai_revenue`
    - Perluas inisialisasi `fuEditForm` (di `openFuEditModal` atau saat `setFuEditForm`) dengan dua field baru: `jenis_project: lead.jenis_project || ''` dan `nilai_revenue: lead.nilai_revenue || ''`
    - Di fungsi `saveFuProspectEdit`, sertakan dalam payload ke `api.updateProject`: `jenis_project: fuEditForm.jenis_project || null` dan `nilai_revenue: fuEditForm.nilai_revenue ? parseFloat(fuEditForm.nilai_revenue) : null`
    - Setelah call `api.updateProject`, cek jika result mengandung `warning` → tampilkan `showAlert(result.warning, 'Perhatian', 'warning')`
    - _Requirements: 4b.1, 4b.2, 4b.3, 4b.4, 10.6_

- [ ] 12. Tests — Property-based tests dan unit tests
  - [~] 12.1 Setup fast-check dan buat file test untuk helper functions
    - Install `fast-check` sebagai devDependency di `frontend/`: `npm install --save-dev fast-check`
    - Buat file test `frontend/src/__tests__/performanceHelpers.test.js` (atau `.test.ts` sesuai project)
    - Import helper functions yang akan ditest (`formatRevenue`, `convertTargetToRupiah`, `calcPersen`, `calcSisa`, `getStatusLabel`); karena fungsi-fungsi ini didefinisikan di dalam `App()`, ekstrak ke file helper terpisah `frontend/src/utils/performanceHelpers.js` agar dapat diimport dan ditest secara independen; update import di `App.jsx`
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.6_

  - [ ]* 12.2 Tulis property test Property 1: `convertTargetToRupiah`
    - **Property 1: Konversi satuan target ke rupiah penuh**
    - Untuk semua `x >= 0`, `convertTargetToRupiah(x)` === `x * 1_000_000_000`
    - Generator: `fc.float({ min: 0, max: 999.999, noNaN: true })`; numRuns: 100
    - **Validates: Requirements 14.6, 2.1, 3.1**

  - [ ]* 12.3 Tulis property test Property 2: `calcPersen`
    - **Property 2: Kalkulasi persen pencapaian**
    - Untuk `t = 0`: `calcPersen(r, 0) === null` untuk semua `r >= 0`
    - Untuk `t > 0`: `calcPersen(r, t) === parseFloat(((r/t)*100).toFixed(1))` untuk semua `r >= 0, t > 0`
    - Generator: `fc.float({ min: 0 })` untuk r; `fc.constant(0)` dan `fc.float({ min: 0.01 })` untuk t (dua sub-test)
    - **Validates: Requirements 7.2, 7.3, 14.2, 14.3**

  - [ ]* 12.4 Tulis property test Property 3: bar progres tidak pernah melebihi 100%
    - **Property 3: Bar progres cap 100%**
    - Untuk semua `r >= 0, t > 0`: `Math.min(calcPersen(r, t), 100) <= 100`
    - Generator: `fc.float({ min: 0 })` untuk r; `fc.float({ min: 0.01 })` untuk t
    - **Validates: Requirements 7.4, 8.6, 14.5**

  - [ ]* 12.5 Tulis property test Property 4: `getStatusLabel` konsisten dengan threshold
    - **Property 4: Label status konsisten dengan threshold**
    - Untuk `p >= 70`: text === 'Di jalur'; `50 <= p < 70`: text === 'Perlu dorong'; `p < 50`: text === 'Tertinggal'; `null`: text === '-'
    - Generator: `fc.float({ min: 0, max: 200 })` untuk persen; tambah case `null` secara eksplisit
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.7**

  - [ ]* 12.6 Tulis property test Property 5: `formatRevenue` menggunakan threshold yang tepat
    - **Property 5: Format revenue menggunakan threshold yang tepat**
    - Untuk `v < 1_000_000`: output mengandung 'rb'; `1_000_000 <= v < 1_000_000_000`: mengandung 'jt'; `v >= 1_000_000_000`: mengandung 'M'
    - Generator: `fc.float({ min: 0 })`; pisahkan tiga sub-test per range
    - **Validates: Requirements 7.6, 14.1**

  - [ ]* 12.7 Tulis unit tests example-based untuk helper functions di file yang sama
    - Test cases: `formatRevenue(0) === 'Rp 0'`, `formatRevenue(500000)` mengandung '500 rb', `formatRevenue(1500000)` mengandung '1,5 jt', `formatRevenue(2500000000)` mengandung '2,5 M'
    - `calcPersen(0, 0) === null`, `calcPersen(7000000000, 10000000000) === 70.0`
    - `calcSisa(10000000000, 7000000000) === 3000000000`, `calcSisa(10000000000, 12000000000) === -2000000000` (melampaui target)
    - `getStatusLabel(null).text === '-'`, `getStatusLabel(70).text === 'Di jalur'`, `getStatusLabel(69.9).text === 'Perlu dorong'`, `getStatusLabel(49.9).text === 'Tertinggal'`
    - **Validates: Requirements 7.6, 8.2, 8.3, 8.4, 14.1, 14.2, 14.3, 14.4**

- [~] 13. Checkpoint — Pastikan semua tests pass dan integrasi berfungsi
  - Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan atau hal yang perlu dikonfirmasi.

---

## Notes

- Task 12.1 melibatkan ekstraksi helper functions ke file terpisah (`utils/performanceHelpers.js`) — ini diperlukan agar fungsi dapat ditest secara independen di luar `App.jsx`. Update import di `App.jsx` setelah ekstraksi.
- Tasks bertanda `*` adalah opsional dan dapat dilewati untuk MVP yang lebih cepat.
- `kanban_card_id` di `performance_realizations` harus VARCHAR (bukan INT) karena `Prospect.no_project` adalah string seperti `"14.IMX-2025-07-10"`.
- `ADD COLUMN IF NOT EXISTS` didukung MySQL 8.0+. Jika server menggunakan MySQL < 8.0, gunakan workaround via `INFORMATION_SCHEMA`.
- Trigger realisasi Kanban (task 3.2) tidak boleh memblokir perubahan status kartu — kegagalan INSERT realisasi harus di-catch dan di-log, bukan di-throw.
- Middleware `auth.js` menggunakan ESM (`import`/`export`) tapi `routes/performance.js` menggunakan CommonJS (`require`) — konsisten dengan pattern di routes lain yang sudah ada.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2"] },
    { "id": 3, "tasks": ["2.4", "4.1"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["6.1", "6.2"] },
    { "id": 6, "tasks": ["6.3", "7.1"] },
    { "id": 7, "tasks": ["8.1", "9.1"] },
    { "id": 8, "tasks": ["8.2", "9.2", "10.1", "11.1"] },
    { "id": 9, "tasks": ["9.3"] },
    { "id": 10, "tasks": ["12.1"] },
    { "id": 11, "tasks": ["12.2", "12.3", "12.4", "12.5", "12.6", "12.7"] }
  ]
}
```
