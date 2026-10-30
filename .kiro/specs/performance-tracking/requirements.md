# Requirements Document

## Introduction

Fitur **Performance Tracking** menambahkan grup menu baru "Performance" di sidebar Infimech ERP Marketing, berisi dua halaman:

1. **Target** — Superadmin menetapkan target revenue (miliar rupiah) dan jumlah project per jenis project, per tahun.
2. **Realisasi** — Semua role melihat pencapaian aktual dibandingkan target, bersumber dari data Kanban Follow Up (otomatis) maupun entri manual.

Fitur ini tidak mencakup grafik per bulan, ringkasan dashboard, atau ekspor laporan.

---

## Glossary

- **Performance_System**: subsistem frontend dan backend yang mengelola target dan realisasi kinerja.
- **Target_Page**: halaman antarmuka untuk menetapkan target revenue dan project per tahun.
- **Realization_Page**: halaman antarmuka untuk melihat dan menambah realisasi per tahun.
- **Superadmin**: role pengguna dengan hak akses penuh termasuk menulis data target dan realisasi.
- **Non_Superadmin**: semua role selain Superadmin (Admin, Operator, Digital Marketing, dan lainnya).
- **Jenis_Project**: salah satu dari lima nilai tetap — CFD, FEA, Engineering Package, Process Simulation, Other.
- **Target_Revenue**: angka target pendapatan dalam satuan miliar rupiah, per jenis project, per tahun.
- **Target_Project**: angka target jumlah project (bilangan bulat ≥ 0), per jenis project, per tahun.
- **Realisasi_Revenue**: jumlah nilai revenue aktual project selesai pada jenis dan tahun tertentu.
- **Realisasi_Project**: jumlah project berstatus **Done** pada jenis dan tahun tertentu.
- **Persen_Tercapai**: hasil perhitungan Realisasi / Target × 100, dibulatkan 1 desimal.
- **Sisa_Target**: selisih Target dikurangi Realisasi (dapat negatif jika melampaui target).
- **Label_Status**: teks hijau "Di jalur" (≥70%), kuning "Perlu dorong" (50–69,9%), atau merah "Tertinggal" (<50%).
- **Sumber_Kanban**: realisasi yang dibuat secara otomatis ketika kartu Prospect berubah ke status **Done**.
- **Sumber_Manual**: realisasi yang dimasukkan secara manual oleh Superadmin melalui form "Tambah realisasi".
- **UPSERT**: operasi menyimpan data yang memperbarui baris lama jika sudah ada, atau menyisipkan baris baru jika belum ada.
- **performance_targets**: tabel database baru yang menyimpan target per tahun dan jenis project.
- **performance_realizations**: tabel database baru yang menyimpan catatan realisasi individual.
- **Prospect**: tabel database yang menyimpan data kartu Kanban Follow Up.

---

## Requirements

---

### Persyaratan 1: Navigasi Sidebar — Grup Performance

**User Story:** Sebagai pengguna yang sudah login, saya ingin melihat grup "Performance" di sidebar di bawah grup Marketing, agar saya dapat mengakses halaman Target dan Realisasi dari satu tempat.

#### Kriteria Penerimaan

1. THE Performance_System SHALL menampilkan grup "Performance" di sidebar tepat di bawah grup "Marketing" yang sudah ada.
2. THE Performance_System SHALL menampilkan ikon `ChevronRight` di sisi kanan label grup "Performance" ketika grup dalam kondisi tertutup, dan ikon `ChevronDown` ketika grup dalam kondisi terbuka.
3. WHEN pengguna mengklik label grup "Performance" dan grup sedang dalam kondisi tertutup, THE Performance_System SHALL membuka grup tersebut; WHEN pengguna mengklik label grup "Performance" dan grup sedang dalam kondisi terbuka, THE Performance_System SHALL menutup grup tersebut.
4. WHEN grup "Performance" terbuka, THE Performance_System SHALL menampilkan tepat dua item menu di bawah label grup: "Target" sebagai item pertama dan "Realisasi" sebagai item kedua, dalam urutan tersebut.
5. WHEN pengguna mengklik item menu "Target", THE Performance_System SHALL menavigasi tampilan ke halaman Target, menerapkan kelas aktif (pill biru) pada item menu "Target", dan menghapus kelas aktif dari semua item menu lain.
6. WHEN pengguna mengklik item menu "Realisasi", THE Performance_System SHALL menavigasi tampilan ke halaman Realisasi, menerapkan kelas aktif (pill biru) pada item menu "Realisasi", dan menghapus kelas aktif dari semua item menu lain.
7. THE Performance_System SHALL menampilkan item menu yang tidak aktif menggunakan gaya yang sama dengan gaya item menu tidak aktif pada grup "Marketing" yang sudah ada.
8. THE Performance_System SHALL mempertahankan semua item menu dalam grup "Marketing" yang sudah ada tanpa perubahan.
9. WHEN pengguna berpindah langsung ke view 'performance-target' atau 'performance-realisasi' (misalnya melalui URL langsung atau navigasi programatik), THE Performance_System SHALL membuka grup "Performance" dan menerapkan kelas aktif pada item menu yang sesuai dengan view tersebut.

---

### Persyaratan 2: Model Data — Tabel performance_targets

**User Story:** Sebagai Superadmin, saya ingin target revenue dan jumlah project tersimpan per tahun dan jenis project di database, agar data target tidak hilang ketika halaman di-refresh.

#### Kriteria Penerimaan

1. THE Performance_System SHALL menyimpan setiap target dengan kolom: `id` (integer auto increment), `tahun` (integer), `jenis_project` (varchar), `target_revenue` (decimal, satuan **miliar rupiah** — contoh: nilai 2,5 berarti Rp 2.500.000.000), `target_project` (integer ≥ 0).
2. THE Performance_System SHALL memberlakukan batasan UNIQUE pada kombinasi kolom `tahun` dan `jenis_project` di tabel `performance_targets`.
3. IF nilai `target_revenue` atau `target_project` yang dikirim ke backend adalah negatif, THEN THE Performance_System SHALL menolak permintaan dengan status 400 dan pesan kesalahan yang menjelaskan kolom yang tidak valid.
4. WHEN menyimpan target untuk kombinasi tahun dan jenis_project yang sudah ada, THE Performance_System SHALL memperbarui baris yang ada (UPSERT), bukan menyisipkan baris duplikat.

---

### Persyaratan 3: Model Data — Tabel performance_realizations

**User Story:** Sebagai Superadmin, saya ingin setiap catatan realisasi tersimpan dengan atribut lengkap, agar histori pencapaian dapat ditelusuri.

#### Kriteria Penerimaan

1. THE Performance_System SHALL menyimpan setiap catatan realisasi dengan kolom: `id` (integer auto increment), `tahun` (integer), `jenis_project` (varchar), `nama_project` (varchar), `nilai_revenue` (decimal ≥ 0, satuan **rupiah penuh** — contoh: nilai 2500000000 berarti Rp 2.500.000.000), `tanggal_selesai` (date), `sumber` (enum: 'manual', 'kanban'), `kanban_card_id` (integer nullable, foreign key ke tabel Prospect), `dibuat_oleh` (integer foreign key ke tabel User), `created_at` (timestamp), `updated_at` (timestamp).
2. IF nilai `nilai_revenue` yang dikirim ke backend adalah negatif, THEN THE Performance_System SHALL menolak permintaan dengan status 400 dan pesan kesalahan yang menjelaskan kolom yang tidak valid.
3. IF `jenis_project` yang dikirim tidak termasuk dalam salah satu dari lima nilai yang valid (CFD, FEA, Engineering Package, Process Simulation, Other), THEN THE Performance_System SHALL menolak permintaan dengan status 400.
4. THE Performance_System SHALL menetapkan nilai kolom `tahun` secara otomatis berdasarkan `tanggal_selesai` (tahun dari tanggal tersebut) ketika menyimpan catatan realisasi.

---

### Persyaratan 4: Model Data — Kolom Baru di Tabel Prospect

**User Story:** Sebagai Superadmin, saya ingin setiap kartu Kanban Follow Up dapat memiliki jenis project dan nilai revenue, agar data realisasi terisi otomatis ketika kartu mencapai tahap Done atau Won.

#### Kriteria Penerimaan

1. THE Performance_System SHALL menambahkan kolom `jenis_project` (varchar, nullable) ke tabel `Prospect` di database.
2. THE Performance_System SHALL menambahkan kolom `nilai_revenue` (decimal, nullable, ≥ 0, satuan **rupiah penuh**) ke tabel `Prospect` di database.
3. WHEN kolom `jenis_project` atau `nilai_revenue` belum diisi pada sebuah kartu Prospect, THE Performance_System SHALL memperlakukan kartu tersebut sebagai tidak dapat dihitung dalam realisasi otomatis.

---

### Persyaratan 4b: Form Kartu Kanban — Field Jenis Project dan Nilai Revenue

**User Story:** Sebagai pengguna, saya ingin form edit/tambah kartu Kanban Follow Up memiliki field "Jenis Project" (dropdown) dan "Nilai Revenue" (angka), agar saya bisa mengisi data yang diperlukan untuk perhitungan realisasi otomatis.

#### Kriteria Penerimaan

1. WHEN pengguna membuka form edit kartu Prospect (modal fuEditModalOpen), THE Performance_System SHALL menampilkan field dropdown "Jenis Project" dengan lima pilihan: CFD, FEA, Engineering Package, Process Simulation, Other; termasuk opsi kosong/belum dipilih sebagai nilai default.
2. WHEN pengguna membuka form edit kartu Prospect, THE Performance_System SHALL menampilkan field angka "Nilai Revenue" (rupiah penuh, ≥ 0, nullable) untuk mengisi estimasi nilai project.
3. WHEN pengguna menyimpan kartu Prospect, THE Performance_System SHALL menyimpan nilai `jenis_project` dan `nilai_revenue` yang diisi ke tabel Prospect.
4. THE Performance_System SHALL menampilkan nilai `jenis_project` dan `nilai_revenue` yang tersimpan ketika form edit dibuka kembali untuk kartu yang sama.

---

### Persyaratan 5: Hak Akses — Baca dan Tulis

**User Story:** Sebagai Non_Superadmin, saya ingin tetap dapat melihat data target dan realisasi, namun tidak dapat mengubahnya, agar kerahasiaan pengelolaan target terjaga.

#### Kriteria Penerimaan

1. THE Performance_System SHALL mengizinkan semua pengguna yang sudah login dengan sesi yang valid untuk mengakses endpoint GET data target dan realisasi.
2. IF pengguna dengan role selain Superadmin mengirim permintaan POST, PUT, atau DELETE ke endpoint target maupun realisasi, THEN THE Performance_System SHALL menolak permintaan tersebut dengan status 403 dan pesan "Akses ditolak: Anda tidak memiliki wewenang untuk melakukan aksi ini."
3. WHILE pengguna yang login bukan Superadmin, THE Performance_System SHALL menampilkan semua field input pada halaman Target dalam mode read-only sehingga nilai field tidak dapat diubah oleh pengguna.
4. WHILE pengguna yang login bukan Superadmin, THE Performance_System SHALL menyembunyikan tombol "Simpan target" dan tombol "Tambah realisasi" dari antarmuka sehingga tombol-tombol tersebut tidak dapat diklik maupun diakses.
5. IF pengguna Non_Superadmin melewati antarmuka dan mengirim permintaan langsung ke endpoint POST, PUT, atau DELETE target maupun realisasi, THEN THE Performance_System SHALL tetap menolak permintaan tersebut dengan status 403 tanpa memproses perubahan data apapun.

---

### Persyaratan 6: Halaman Target — Tampilan dan Interaksi

**User Story:** Sebagai Superadmin, saya ingin menetapkan target revenue dan jumlah project per jenis project untuk tahun tertentu melalui antarmuka yang jelas, agar target tersimpan dengan benar di database.

#### Kriteria Penerimaan

1. WHEN halaman Target dimuat, THE Performance_System SHALL menampilkan selektor tahun di sisi kanan atas halaman dengan nilai default tahun berjalan.
2. WHEN pengguna memilih tahun berbeda pada selektor, THE Performance_System SHALL memuat data target untuk tahun yang dipilih dari backend.
3. WHEN backend mengembalikan tidak ada data untuk tahun yang dipilih, THE Performance_System SHALL menampilkan semua field dengan nilai default 0.
4. THE Performance_System SHALL menampilkan dua kartu berdampingan: "Target Revenue" dan "Target Project".
5. THE Performance_System SHALL menampilkan satu baris per jenis project (CFD, FEA, Engineering Package, Process Simulation, Other) di dalam setiap kartu; field input pada kartu Target Revenue berupa angka desimal tidak negatif dengan nilai maksimal 999.999 (satuan miliar rupiah), dan field input pada kartu Target Project berupa bilangan bulat tidak negatif dengan nilai maksimal 9.999.
6. THE Performance_System SHALL menampilkan satuan "M" (miliar rupiah) di samping setiap field input pada kartu Target Revenue.
7. WHEN pengguna mengubah nilai input pada kartu manapun, THE Performance_System SHALL memperbarui baris total di bagian bawah kartu tersebut secara otomatis.
8. IF nilai yang dimasukkan pengguna pada field input adalah negatif atau bukan angka, THEN THE Performance_System SHALL menampilkan pesan kesalahan di samping field tersebut tanpa menunggu tombol Simpan ditekan, dan THE Performance_System SHALL menonaktifkan tombol "Simpan target" selama masih terdapat error validasi.
9. WHEN Superadmin mengklik tombol "Simpan target", THE Performance_System SHALL mengirim seluruh data target untuk tahun yang dipilih ke backend untuk disimpan.
10. WHEN penyimpanan target berhasil, THE Performance_System SHALL menampilkan notifikasi keberhasilan menggunakan mekanisme `showAlert` yang sudah ada.
11. IF permintaan penyimpanan target gagal, THEN THE Performance_System SHALL menampilkan pesan kesalahan menggunakan mekanisme `showAlert` yang sudah ada.
12. WHERE layar lebih sempit dari 768px, THE Performance_System SHALL menampilkan dua kartu dalam satu kolom vertikal.

---

### Persyaratan 7: Halaman Realisasi — Tampilan Ringkasan

**User Story:** Sebagai pengguna yang sudah login, saya ingin melihat ringkasan total realisasi dibandingkan target di bagian atas setiap kartu, agar saya langsung mengetahui posisi kinerja keseluruhan.

#### Kriteria Penerimaan

1. THE Performance_System SHALL menampilkan dua kartu: "Realisasi Revenue" dan "Realisasi Project" di halaman Realisasi.
2. THE Performance_System SHALL menampilkan di bagian atas setiap kartu: total realisasi keseluruhan (sum semua jenis), total target keseluruhan, bar progres, Persen_Tercapai (dihitung sebagai Realisasi / Target × 100, dibulatkan 1 desimal), dan Sisa_Target (dihitung sebagai Target − Realisasi; jika hasilnya negatif, ditampilkan sebagai angka negatif, tidak disembunyikan).
3. WHEN nilai target keseluruhan adalah 0 atau belum ditetapkan, THE Performance_System SHALL menampilkan tanda "-" pada kolom Persen_Tercapai dan Sisa_Target, bukan nilai numerik atau error.
4. THE Performance_System SHALL membatasi lebar bar progres maksimal 100% secara visual, meskipun Persen_Tercapai melebihi 100%.
5. THE Performance_System SHALL menghitung total pada bagian atas kartu sebagai jumlah (sum) semua jenis project, bukan rata-rata persen.
6. THE Performance_System SHALL memformat angka revenue menggunakan aturan berikut: nilai kurang dari 1.000.000 (kurang dari 1 juta) ditampilkan sebagai "Rp X rb" (dalam ribuan); nilai ≥ 1.000.000 dan < 1.000.000.000 (antara 1 juta hingga kurang dari 1 miliar) ditampilkan sebagai "Rp X,X jt" (dalam jutaan, 1 desimal); nilai ≥ 1.000.000.000 (1 miliar atau lebih) ditampilkan sebagai "Rp X,X M" (dalam miliar, 1 desimal); jumlah project ditampilkan sebagai bilangan bulat tanpa satuan mata uang.

---

### Persyaratan 8: Halaman Realisasi — Tampilan Per Jenis Project

**User Story:** Sebagai pengguna yang sudah login, saya ingin melihat rincian realisasi per jenis project beserta status pencapaiannya, agar saya dapat mengidentifikasi jenis project mana yang memerlukan perhatian.

#### Kriteria Penerimaan

1. THE Performance_System SHALL menampilkan satu baris per jenis project di bawah ringkasan total, berisi: nama jenis project, Persen_Tercapai, bar progres, teks perbandingan, dan Label_Status; kartu revenue HARUS menampilkan teks perbandingan dalam format "Rp X,X M dari Rp X,X M", dan kartu project HARUS menampilkan teks perbandingan dalam format "X dari Y project".
2. WHEN Persen_Tercapai suatu jenis project lebih besar dari atau sama dengan 70, THE Performance_System SHALL menampilkan Label_Status "Di jalur" dengan warna hijau.
3. WHEN Persen_Tercapai suatu jenis project lebih besar dari atau sama dengan 50 dan kurang dari 70, THE Performance_System SHALL menampilkan Label_Status "Perlu dorong" dengan warna kuning.
4. WHEN Persen_Tercapai suatu jenis project kurang dari 50, THE Performance_System SHALL menampilkan Label_Status "Tertinggal" dengan warna merah.
5. WHEN target suatu jenis project adalah 0 atau belum ditetapkan, THE Performance_System SHALL menampilkan tanda '-' pada kolom Persen_Tercapai dan Label_Status untuk jenis project tersebut.
6. THE Performance_System SHALL membatasi lebar bar progres per baris jenis project maksimal 100% secara visual, meskipun Persen_Tercapai jenis tersebut melebihi 100%.
7. THE Performance_System SHALL menampilkan Label_Status (teks berwarna) hanya untuk jenis project yang memiliki nilai target > 0; untuk jenis project dengan target 0 atau belum ditetapkan, kolom Label_Status HARUS menampilkan tanda '-' tanpa warna.

---

### Persyaratan 9: Halaman Realisasi — Selektor Tahun

**User Story:** Sebagai pengguna, saya ingin memilih tahun berbeda pada halaman Realisasi, agar saya dapat membandingkan kinerja antar tahun.

#### Kriteria Penerimaan

1. THE Performance_System SHALL menampilkan selektor tahun di sisi kanan atas halaman Realisasi, dengan nilai default tahun berjalan.
2. WHEN pengguna memilih tahun berbeda, THE Performance_System SHALL memuat ulang data realisasi dan target untuk tahun yang dipilih dari backend.

---

### Persyaratan 10: Realisasi Otomatis dari Kanban

**User Story:** Sebagai pengguna yang sudah login, saya ingin realisasi tercatat secara otomatis ketika kartu Kanban berubah ke status Done, agar saya tidak perlu memasukkan data yang sama dua kali.

#### Kriteria Penerimaan

1. WHEN status kartu Prospect berubah menjadi "Done" DAN kartu tersebut memiliki nilai `jenis_project` yang valid (string tidak null dan tidak kosong), THE Performance_System SHALL membuat catatan realisasi baru di tabel `performance_realizations` dengan `sumber` bernilai 'kanban' dan `kanban_card_id` berisi id kartu tersebut.
2. WHEN catatan realisasi dibuat secara otomatis dari kartu Prospect, THE Performance_System SHALL menggunakan nilai `nilai_revenue` dari kartu Prospect sebagai `nilai_revenue` pada catatan realisasi; jika `nilai_revenue` pada kartu Prospect adalah null, THE Performance_System SHALL menggunakan nilai default 0.
3. IF kartu Prospect yang berubah ke status Done tidak memiliki `jenis_project` yang valid, THEN THE Performance_System SHALL melewati pembuatan catatan realisasi otomatis sehingga perubahan status kartu tidak diblokir atau ditunda.
4. WHEN status kartu Prospect yang sama kembali diubah ke Done dan catatan realisasi dengan `kanban_card_id` yang sama sudah ada, THE Performance_System SHALL melewati pembuatan catatan realisasi secara diam-diam, mempertahankan catatan lama, dan tidak memblokir perubahan status kartu.
5. WHEN status kartu Prospect berubah menjadi 'Done', THE Performance_System SHALL menetapkan `tanggal_selesai` pada catatan realisasi yang dibuat sebagai tanggal (DATE) pada saat perubahan status tersebut terjadi.
6. IF kartu Prospect berubah ke status 'Done' dan field `jenis_project` tidak terisi, THEN THE Performance_System SHALL menampilkan pesan peringatan kepada pengguna yang melakukan perubahan status, menyatakan bahwa realisasi tidak dapat dicatat secara otomatis karena jenis project belum diisi.
7. WHEN field `jenis_project` diisi pada kartu Prospect yang sudah berstatus 'Done' dan belum memiliki catatan realisasi dengan `kanban_card_id` yang sama, THE Performance_System SHALL membuat catatan realisasi baru dengan `sumber` bernilai 'kanban' dan `tanggal_selesai` diisi tanggal hari ini.
8. THE Performance_System SHALL menampilkan label visual per baris di halaman Realisasi yang menunjukkan sumber data setiap catatan (kanban atau manual).

---

### Persyaratan 11: Realisasi Manual — Form Tambah Realisasi

**User Story:** Sebagai Superadmin, saya ingin menambahkan catatan realisasi secara manual untuk project yang tidak berasal dari Kanban, agar semua pencapaian terhitung dalam laporan.

#### Kriteria Penerimaan

1. WHEN Superadmin mengklik tombol "Tambah realisasi", THE Performance_System SHALL menampilkan form modal dengan field: jenis project (dropdown wajib dipilih), nama project (teks wajib diisi), nilai revenue (angka ≥ 0, wajib diisi), tanggal selesai (date wajib diisi).
2. IF pengguna mengirim form dengan field jenis project yang tidak dipilih, THEN THE Performance_System SHALL mencegah pengiriman dan menampilkan pesan kesalahan di samping field tersebut.
3. IF pengguna mengirim form dengan nilai revenue yang negatif, THEN THE Performance_System SHALL mencegah pengiriman dan menampilkan pesan kesalahan di samping field nilai revenue.
4. WHEN Superadmin berhasil menyimpan catatan realisasi manual, THE Performance_System SHALL menutup modal, menampilkan notifikasi keberhasilan, dan memuat ulang data realisasi pada halaman.
5. THE Performance_System SHALL menetapkan nilai kolom `sumber` sebagai 'manual' dan `kanban_card_id` sebagai NULL untuk setiap catatan realisasi yang dibuat melalui form ini.

---

### Persyaratan 12: API Backend — Endpoint Target

**User Story:** Sebagai Performance_System (frontend), saya memerlukan endpoint backend yang andal untuk menyimpan dan mengambil data target, agar data tersedia secara konsisten.

#### Kriteria Penerimaan

1. THE Performance_System SHALL menyediakan endpoint `GET /api/performance/targets?tahun=YYYY` yang mengembalikan seluruh target untuk tahun yang diminta.
2. THE Performance_System SHALL menyediakan endpoint `POST /api/performance/targets` yang menerima array target (satu per jenis project) dan menyimpannya menggunakan UPSERT.
3. IF request ke endpoint POST tidak menyertakan token autentikasi yang valid, THEN THE Performance_System SHALL menolak permintaan dengan status 401.
4. IF request ke endpoint POST dikirim oleh pengguna dengan role selain Superadmin, THEN THE Performance_System SHALL menolak permintaan dengan status 403.

---

### Persyaratan 13: API Backend — Endpoint Realisasi

**User Story:** Sebagai Performance_System (frontend), saya memerlukan endpoint backend yang andal untuk menyimpan dan mengambil data realisasi, termasuk agregasi per jenis project.

#### Kriteria Penerimaan

1. THE Performance_System SHALL menyediakan endpoint `GET /api/performance/realizations?tahun=YYYY` yang mengembalikan data realisasi yang sudah diagregasi per jenis project (total revenue, total project) untuk tahun yang diminta.
2. THE Performance_System SHALL menyediakan endpoint `POST /api/performance/realizations` yang menerima satu catatan realisasi manual dan menyimpannya ke tabel `performance_realizations`.
3. IF request ke endpoint POST tidak menyertakan token autentikasi yang valid, THEN THE Performance_System SHALL menolak permintaan dengan status 401.
4. IF request ke endpoint POST dikirim oleh pengguna dengan role selain Superadmin, THEN THE Performance_System SHALL menolak permintaan dengan status 403.
5. THE Performance_System SHALL mendaftarkan router performance di file `server.js` dengan path `app.use('/api/performance', ...)`.
6. THE Performance_System SHALL menyediakan endpoint `GET /api/performance/realizations/list?tahun=YYYY` yang mengembalikan **daftar individual** semua catatan realisasi untuk tahun yang diminta (tidak diagregasi), termasuk kolom: id, jenis_project, nama_project, nilai_revenue, tanggal_selesai, sumber, kanban_card_id.
7. THE Performance_System SHALL menyediakan endpoint `PUT /api/performance/realizations/:id` yang mengizinkan Superadmin memperbarui catatan realisasi berdasarkan id.
8. THE Performance_System SHALL menyediakan endpoint `DELETE /api/performance/realizations/:id` yang mengizinkan Superadmin menghapus catatan realisasi berdasarkan id.
9. IF request ke endpoint PUT atau DELETE tidak menyertakan token autentikasi yang valid, THEN THE Performance_System SHALL menolak permintaan dengan status 401.
10. IF request ke endpoint PUT atau DELETE dikirim oleh pengguna dengan role selain Superadmin, THEN THE Performance_System SHALL menolak permintaan dengan status 403.

---

### Persyaratan 14: Perhitungan dan Format Angka

**User Story:** Sebagai pengguna, saya ingin semua angka ditampilkan dalam format Indonesia yang konsisten dan perhitungan persen dilakukan secara akurat, agar saya tidak salah membaca data kinerja.

#### Kriteria Penerimaan

1. THE Performance_System SHALL memformat angka revenue menggunakan aturan: nilai < 1 juta ditampilkan sebagai 'Rp X rb', nilai ≥ 1 juta dan < 1 miliar ditampilkan sebagai 'Rp X,X jt', nilai ≥ 1 miliar ditampilkan sebagai 'Rp X,X M'.
2. THE Performance_System SHALL membulatkan Persen_Tercapai ke 1 desimal (contoh: 73,5%).
3. THE Performance_System SHALL menghitung Persen_Tercapai menggunakan rumus: (Realisasi / Target) × 100.
4. THE Performance_System SHALL menghitung Sisa_Target menggunakan rumus: Target − Realisasi (nilai boleh negatif jika melampaui target).
5. WHEN nilai Persen_Tercapai melebihi 100, THE Performance_System SHALL tetap menampilkan angka persen yang sebenarnya (misalnya "125,0%"), namun membatasi lebar bar progres di 100%.
6. WHEN menghitung Persen_Tercapai dan Sisa_Target revenue, THE Performance_System SHALL mengkonversi `target_revenue` dari miliar rupiah ke rupiah penuh (dikalikan 1.000.000.000) sebelum dibandingkan dengan `nilai_revenue` realisasi yang tersimpan dalam rupiah penuh.

---

### Persyaratan 15: Tampilan Responsif dan Konsistensi Gaya

**User Story:** Sebagai pengguna yang mengakses lewat ponsel, saya ingin halaman Performance tetap dapat dibaca dan digunakan dengan nyaman, agar saya tidak kehilangan akses ke data kinerja saat bepergian.

#### Kriteria Penerimaan

1. WHERE lebar layar kurang dari 768px, THE Performance_System SHALL menampilkan kartu-kartu di halaman Target dan Realisasi dalam satu kolom vertikal.
2. THE Performance_System SHALL menggunakan CSS class yang sudah ada (`glass-panel`, `btn`, `btn-primary`, `btn-secondary`, `form-input`, `form-select`, `kpi-card`, `modal-overlay`, `modal-content`) untuk semua elemen baru.
3. THE Performance_System SHALL menggunakan ikon dari library `lucide-react` untuk semua ikon baru yang ditambahkan.
4. THE Performance_System SHALL menerapkan tema gelap konsisten dengan tampilan aplikasi yang sudah ada.

---

### Persyaratan 16: Halaman Realisasi — Daftar Riwayat Realisasi

**User Story:** Sebagai pengguna yang sudah login, saya ingin melihat daftar semua catatan realisasi individual di halaman Realisasi, agar saya dapat memeriksa asal-usul setiap angka pencapaian.

#### Kriteria Penerimaan

1. THE Performance_System SHALL menampilkan tabel/daftar riwayat realisasi di bawah kartu ringkasan pada halaman Realisasi, berisi kolom: No, Nama Project, Jenis Project, Nilai Revenue (format "Rp X,X M"), Tanggal Selesai, Sumber.
2. THE Performance_System SHALL menampilkan label visual di kolom Sumber untuk setiap baris: "Kanban" dengan warna berbeda dari "Manual" (contoh: biru untuk kanban, abu-abu untuk manual).
3. WHEN pengguna memilih tahun berbeda pada selektor, THE Performance_System SHALL memuat ulang daftar riwayat untuk tahun yang dipilih.
4. WHEN Superadmin mengklik tombol edit di baris riwayat, THE Performance_System SHALL membuka modal form pre-filled dengan data catatan tersebut untuk diedit (field: jenis project, nama project, nilai revenue, tanggal selesai).
5. WHEN Superadmin mengklik tombol hapus di baris riwayat dan mengkonfirmasi, THE Performance_System SHALL menghapus catatan realisasi tersebut dan memuat ulang daftar riwayat dan kartu ringkasan.
6. THE Performance_System SHALL menyembunyikan tombol edit dan hapus dari pengguna Non_Superadmin.
7. WHERE layar lebih sempit dari 768px, THE Performance_System SHALL menampilkan daftar riwayat dalam format yang dapat di-scroll secara horizontal.
