# Dokumen Requirements

## Pendahuluan

Fitur **Catatan** (*Notes*) adalah modul baru pada aplikasi Marketing ERP Infimech yang memungkinkan operator dan anggota tim mencatat masalah operasional, temuan lapangan, ide pemasaran, serta informasi penting lainnya secara terpusat. Catatan bersifat per-pengguna (penulis tercatat) dan dapat dicari maupun difilter berdasarkan kategori, sehingga mempermudah koordinasi dan dokumentasi internal tim marketing.

Fitur ini ditambahkan sebagai menu baru di sidebar aplikasi, sejajar dengan menu Dashboard, Marketing Operator, Marketing Assets, GSC Dashboard, dan Follow Up.

---

## Glosarium

- **Catatan**: Entitas data yang menyimpan judul, isi, kategori, dan metadata penulis sebuah note/catatan internal.
- **Kategori**: Klasifikasi catatan yang terdiri dari: `Masalah`, `Temuan`, `Ide`, `Lainnya`.
- **Penulis**: Pengguna (operator) yang login dan membuat catatan. Identitas penulis diambil dari token JWT yang aktif.
- **Notes_System**: Subsistem backend yang menangani operasi CRUD catatan, termasuk endpoint REST API di `/api/notes`.
- **Notes_UI**: Komponen antarmuka React yang menampilkan halaman daftar catatan, form modal pembuatan/pengeditan, dan fungsi pencarian serta filter.
- **Notes_DB**: Tabel `notes` pada database MySQL yang menyimpan seluruh data catatan.

---

## Requirements

### Requirement 1: Akses Menu Catatan

**User Story:** Sebagai operator yang sudah login, saya ingin melihat menu "Catatan" di sidebar aplikasi, agar saya dapat mengakses halaman catatan dengan mudah dari mana saja dalam aplikasi.

#### Acceptance Criteria

1. THE Notes_UI SHALL menampilkan item menu "Catatan" pada sidebar navigasi aplikasi, di bawah item menu "Follow Up".
2. WHEN pengguna mengklik menu "Catatan" di sidebar, THE Notes_UI SHALL mengganti tampilan utama dengan halaman daftar catatan tanpa melakukan full page reload.
3. WHILE pengguna berada di halaman catatan, THE Notes_UI SHALL menampilkan item menu "Catatan" dalam keadaan aktif (highlighted) pada sidebar.

---

### Requirement 2: Tampilan Halaman Daftar Catatan

**User Story:** Sebagai operator, saya ingin melihat seluruh catatan yang ada dalam tampilan grid card yang jelas, agar saya dapat memindai informasi dengan cepat.

#### Acceptance Criteria

1. THE Notes_UI SHALL menampilkan header halaman yang berisi judul "Catatan", subtitle "Catat masalah, temuan, ide, dan informasi penting lainnya", dan tombol "+ Catatan Baru" di sisi kanan atas.
2. THE Notes_UI SHALL menampilkan input pencarian dengan placeholder teks "Cari judul, isi, atau penulis...".
3. THE Notes_UI SHALL menampilkan tombol filter kategori dalam bentuk pill/tab dengan pilihan: "Semua", "Masalah", "Temuan", "Ide", "Lainnya".
4. THE Notes_UI SHALL menampilkan daftar catatan dalam tata letak grid card yang responsif.
5. WHEN tidak ada catatan yang ditemukan, THE Notes_UI SHALL menampilkan pesan kosong yang informatif kepada pengguna.

---

### Requirement 3: Tampilan Card Catatan

**User Story:** Sebagai operator, saya ingin setiap card catatan menampilkan informasi ringkas yang relevan, agar saya dapat mengenali isi catatan tanpa harus membukanya.

#### Acceptance Criteria

1. THE Notes_UI SHALL menampilkan badge kategori pada setiap card dengan warna berbeda per kategori: "Masalah" (merah), "Temuan" (oranye), "Ide" (hijau), "Lainnya" (biru muda).
2. THE Notes_UI SHALL menampilkan judul catatan pada setiap card dalam gaya teks tebal (bold).
3. THE Notes_UI SHALL menampilkan pratinjau isi catatan pada setiap card yang dipotong maksimal 2 baris teks.
4. THE Notes_UI SHALL menampilkan nama penulis catatan pada setiap card dalam gaya teks tebal (bold).
5. THE Notes_UI SHALL menampilkan tanggal dan waktu pembuatan catatan pada setiap card dengan ikon jam di sebelah kiri teks tanggal.

---

### Requirement 4: Pencarian Catatan

**User Story:** Sebagai operator, saya ingin mencari catatan berdasarkan judul, isi, atau nama penulis, agar saya dapat menemukan catatan spesifik dengan cepat.

#### Acceptance Criteria

1. WHEN pengguna mengetikkan teks pada input pencarian, THE Notes_UI SHALL memfilter daftar catatan yang ditampilkan sehingga hanya catatan yang judulnya, isinya, atau nama penulisnya mengandung teks tersebut yang muncul.
2. WHEN pengguna mengosongkan input pencarian, THE Notes_UI SHALL menampilkan kembali seluruh catatan sesuai filter kategori yang aktif.
3. THE Notes_UI SHALL melakukan pencarian secara lokal pada data catatan yang sudah dimuat, tanpa memerlukan permintaan jaringan tambahan untuk setiap karakter yang diketik.

---

### Requirement 5: Filter Kategori Catatan

**User Story:** Sebagai operator, saya ingin memfilter catatan berdasarkan kategori, agar saya dapat fokus pada jenis catatan yang relevan.

#### Acceptance Criteria

1. WHEN pengguna mengklik tombol filter kategori "Masalah", "Temuan", "Ide", atau "Lainnya", THE Notes_UI SHALL menampilkan hanya catatan dengan kategori yang dipilih.
2. WHEN pengguna mengklik tombol filter kategori "Semua", THE Notes_UI SHALL menampilkan seluruh catatan tanpa memandang kategori.
3. WHILE filter kategori aktif, THE Notes_UI SHALL menampilkan tombol filter yang dipilih dalam keadaan aktif (highlighted) secara visual.
4. WHEN filter kategori aktif dan pengguna juga menggunakan pencarian teks, THE Notes_UI SHALL menerapkan kedua filter secara bersamaan sehingga hanya catatan yang memenuhi keduanya yang ditampilkan.

---

### Requirement 6: Membuat Catatan Baru

**User Story:** Sebagai operator, saya ingin membuat catatan baru melalui modal form, agar saya dapat mendokumentasikan informasi penting dengan cepat.

#### Acceptance Criteria

1. WHEN pengguna mengklik tombol "+ Catatan Baru", THE Notes_UI SHALL menampilkan modal dialog yang berisi form pembuatan catatan.
2. THE Notes_UI SHALL menyediakan field input teks "Judul" yang wajib diisi pada form catatan baru.
3. THE Notes_UI SHALL menyediakan dropdown atau pilihan "Kategori" dengan opsi: "Masalah", "Temuan", "Ide", "Lainnya" pada form catatan baru.
4. THE Notes_UI SHALL menyediakan field textarea "Isi Catatan" yang wajib diisi pada form catatan baru.
5. WHEN pengguna mengklik tombol simpan pada form dan seluruh field wajib telah diisi, THE Notes_UI SHALL mengirimkan permintaan pembuatan catatan ke Notes_System dan menutup modal setelah berhasil.
6. IF field wajib (judul atau isi catatan) tidak diisi saat pengguna menekan tombol simpan, THEN THE Notes_UI SHALL menampilkan pesan validasi yang menginformasikan field mana yang belum diisi tanpa menutup modal.
7. WHEN pengguna mengklik tombol batal atau area di luar modal, THE Notes_UI SHALL menutup modal tanpa menyimpan data.

---

### Requirement 7: Menyimpan Catatan ke Database

**User Story:** Sebagai sistem, saya ingin catatan baru disimpan ke database dengan atribut penulis yang terverifikasi, agar integritas dan akuntabilitas data terjaga.

#### Acceptance Criteria

1. WHEN Notes_System menerima permintaan pembuatan catatan dengan token JWT yang valid, THE Notes_System SHALL menyimpan catatan baru ke Notes_DB dengan field: judul, isi, kategori, `user_id` (dari token JWT), dan `created_at` (timestamp server saat ini).
2. IF Notes_System menerima permintaan pembuatan catatan tanpa token JWT yang valid, THEN THE Notes_System SHALL menolak permintaan dan mengembalikan respons HTTP 401 Unauthorized.
3. IF Notes_System menerima permintaan pembuatan catatan dengan field judul atau isi yang kosong, THEN THE Notes_System SHALL menolak permintaan dan mengembalikan respons HTTP 400 Bad Request beserta pesan error yang deskriptif.
4. IF Notes_System gagal menyimpan catatan karena error database, THEN THE Notes_System SHALL mengembalikan respons HTTP 500 Internal Server Error beserta pesan error yang deskriptif.

---

### Requirement 8: Mengambil Daftar Catatan

**User Story:** Sebagai sistem, saya ingin endpoint pengambilan catatan mengembalikan data yang lengkap termasuk informasi penulis, agar antarmuka dapat menampilkan semua informasi yang dibutuhkan.

#### Acceptance Criteria

1. WHEN Notes_System menerima permintaan GET daftar catatan dengan token JWT yang valid, THE Notes_System SHALL mengembalikan seluruh catatan yang tersimpan di Notes_DB diurutkan dari yang terbaru (berdasarkan `created_at` descending), disertai nama penulis dari tabel `User`.
2. IF Notes_System menerima permintaan GET daftar catatan tanpa token JWT yang valid, THEN THE Notes_System SHALL menolak permintaan dan mengembalikan respons HTTP 401 Unauthorized.
3. THE Notes_System SHALL mengembalikan setiap catatan dengan field berikut: `id`, `title`, `content`, `category`, `created_at`, `user_id`, dan `author_name` (nama lengkap penulis dari tabel User).

---

### Requirement 9: Mengedit Catatan

**User Story:** Sebagai operator, saya ingin dapat mengedit catatan yang sudah ada, agar saya dapat memperbarui informasi yang berubah atau memperbaiki kesalahan.

#### Acceptance Criteria

1. WHEN pengguna mengklik tombol edit pada sebuah card catatan, THE Notes_UI SHALL menampilkan modal form yang telah terisi dengan data catatan yang dipilih (judul, kategori, dan isi).
2. WHEN pengguna menyimpan perubahan pada modal edit dan seluruh field wajib terisi, THE Notes_UI SHALL mengirimkan permintaan pembaruan catatan ke Notes_System dan memperbarui tampilan card catatan yang bersangkutan setelah berhasil.
3. WHEN Notes_System menerima permintaan pembaruan catatan dengan token JWT yang valid dan `id` catatan yang ada, THE Notes_System SHALL memperbarui data catatan tersebut di Notes_DB.
4. IF Notes_System menerima permintaan pembaruan catatan untuk `id` catatan yang tidak ditemukan di Notes_DB, THEN THE Notes_System SHALL mengembalikan respons HTTP 404 Not Found.

---

### Requirement 10: Menghapus Catatan

**User Story:** Sebagai operator, saya ingin dapat menghapus catatan yang sudah tidak relevan, agar daftar catatan tetap bersih dan terorganisir.

#### Acceptance Criteria

1. WHEN pengguna mengklik tombol hapus pada sebuah card catatan, THE Notes_UI SHALL menampilkan dialog konfirmasi kepada pengguna sebelum melanjutkan penghapusan.
2. WHEN pengguna mengonfirmasi penghapusan, THE Notes_UI SHALL mengirimkan permintaan penghapusan ke Notes_System dan menghilangkan card catatan yang bersangkutan dari tampilan setelah berhasil.
3. WHEN Notes_System menerima permintaan penghapusan catatan dengan token JWT yang valid dan `id` catatan yang ada, THE Notes_System SHALL menghapus catatan tersebut secara permanen dari Notes_DB.
4. IF Notes_System menerima permintaan penghapusan catatan untuk `id` catatan yang tidak ditemukan di Notes_DB, THEN THE Notes_System SHALL mengembalikan respons HTTP 404 Not Found.

---

### Requirement 11: Skema Database Catatan

**User Story:** Sebagai sistem, saya ingin tabel `notes` di database memiliki struktur yang tepat, agar data catatan tersimpan dengan efisien dan relasi ke tabel pengguna terjaga.

#### Acceptance Criteria

1. THE Notes_DB SHALL memiliki tabel `notes` dengan kolom: `id` (INT, AUTO_INCREMENT, PRIMARY KEY), `user_id` (INT, NOT NULL, FOREIGN KEY ke tabel `User`), `title` (VARCHAR(255), NOT NULL), `content` (TEXT, NOT NULL), `category` (ENUM('Masalah','Temuan','Ide','Lainnya'), NOT NULL, DEFAULT 'Lainnya'), `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP), `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP).
2. THE Notes_DB SHALL mendefinisikan relasi foreign key dari kolom `user_id` pada tabel `notes` ke kolom `id` pada tabel `User` dengan aksi `ON DELETE CASCADE`.
3. THE Notes_DB SHALL mendefinisikan index pada kolom `user_id` di tabel `notes` untuk mengoptimalkan performa query pengambilan catatan per pengguna.
