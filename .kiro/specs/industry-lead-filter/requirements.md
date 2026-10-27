# Requirements Document

## Introduction

Fitur **Industry Lead Filter** memperluas kemampuan manajemen leads di aplikasi Marketing ERP Infimech dengan dua peningkatan utama:

1. **Penambahan opsi industri baru** pada form input lead — yaitu "Oil & Gas", "Petrochemical", "Power and Energy", dan "Construction" — melengkapi daftar yang sudah ada.
2. **Filter industri di tab Customer Segmentation** — memungkinkan pengguna menyaring tampilan leads di setiap kartu segmen berdasarkan industri yang dipilih, sehingga analisis segmentasi lebih terarah dan relevan.

Saat ini daftar industri di frontend (`industriesList`) bersifat hardcoded dan tidak mencakup sektor-sektor utama yang menjadi target pasar Infimech (engineering simulation, oil & gas, konstruksi, energi). Tab Customer Segmentation juga belum menyediakan mekanisme filter berbasis industri, sehingga pengguna tidak bisa melihat distribusi lead per industri secara langsung di halaman segmentasi.

---

## Glossary

- **System**: Aplikasi Marketing ERP Infimech (frontend React + backend Express).
- **Lead_Form**: Komponen form modal di frontend untuk menambahkan atau mengedit data lead/klien.
- **Industry_List**: Daftar nilai industri yang tersedia sebagai opsi pilihan pada `<select>` di Lead_Form, saat ini berupa array `industriesList` hardcoded di `App.jsx`.
- **Customer_Segmentation_Tab**: Tampilan tab kedua di halaman Marketing Operator yang menampilkan kartu-kartu segmen pelanggan beserta tabel leads yang cocok.
- **Industry_Filter**: Komponen dropdown baru di Customer_Segmentation_Tab yang memungkinkan pengguna memilih satu industri sebagai kriteria tambahan untuk menyaring leads yang tampil di setiap kartu segmen.
- **Segment_Card**: Kartu individual di Customer_Segmentation_Tab yang merepresentasikan satu segmen (contoh: "High Score Hot Leads", "Dormant Leads") beserta daftar leads yang memenuhi kriteria segmen tersebut.
- **Leads_State**: State `leads` di `App.jsx` yang berisi daftar lead hasil fetch dari endpoint `GET /leads` dengan parameter filter.
- **Backend_Leads_Endpoint**: Endpoint `GET /leads` di `routes/leads.js` yang sudah mendukung parameter query `?industry=`.

---

## Requirements

### Kebutuhan 1: Penambahan Opsi Industri Baru pada Form Lead

**User Story:** Sebagai operator marketing, saya ingin memilih industri "Oil & Gas", "Petrochemical", "Power and Energy", atau "Construction" saat menginput atau mengedit data lead, agar klasifikasi lead sesuai dengan sektor industri target pasar Infimech yang sebenarnya.

#### Kriteria Penerimaan

1. THE System SHALL menampilkan tepat 13 opsi industri di dalam elemen `<select>` industri pada Lead_Form, mencakup opsi lama (Technology, E-commerce, Tourism, Finance, F&B, Education, FMCG, Energy) ditambah opsi baru (Oil & Gas, Petrochemical, Power and Energy, Construction), dengan "Other" selalu berada di posisi terakhir.
2. WHEN pengguna memilih salah satu industri dari Lead_Form dan menyimpan lead, THE System SHALL menyimpan nilai industri ke basis data dengan nilai yang identik secara string (persis sama) dengan teks opsi yang dipilih.
3. WHEN pengguna membuka form edit untuk lead yang nilai industri-nya termasuk dalam salah satu dari 13 opsi yang valid, THE Lead_Form SHALL menampilkan nilai industri tersebut sebagai pilihan yang terpilih (selected).
4. IF pengguna membuka form edit untuk lead yang nilai industri-nya tidak termasuk dalam 13 opsi yang valid (nilai lama/legacy), THEN THE Lead_Form SHALL menampilkan "Technology" sebagai nilai terpilih default dan tidak menyebabkan error tampilan.
5. IF pengguna tidak mengubah pilihan industri pada Lead_Form sebelum menyimpan lead baru, THEN THE System SHALL menyimpan nilai "Technology" sebagai nilai industri di basis data.

---

### Kebutuhan 2: Filter Industri di Tab Customer Segmentation

**User Story:** Sebagai operator marketing, saya ingin memfilter tampilan leads di Customer Segmentation berdasarkan industri tertentu, agar saya bisa fokus menganalisis segmen pelanggan dalam satu sektor industri tanpa tercampur dengan sektor lain.

#### Kriteria Penerimaan

1. THE Customer_Segmentation_Tab SHALL menampilkan sebuah Industry_Filter berupa dropdown yang berisi seluruh opsi industri yang tersedia di Industry_List, ditambah opsi "Semua Industri" sebagai nilai default, di mana setiap opsi industri menampilkan jumlah leads yang cocok secara dinamis berdasarkan data di Leads_State.
2. WHEN pengguna memilih sebuah industri di Industry_Filter, THE Customer_Segmentation_Tab SHALL memperbarui tampilan leads di setiap Segment_Card sehingga hanya menampilkan leads yang industri-nya sesuai dengan industri yang dipilih, tanpa memerlukan tindakan konfirmasi tambahan dari pengguna.
3. WHILE opsi "Semua Industri" dipilih di Industry_Filter, THE Customer_Segmentation_Tab SHALL menampilkan seluruh leads di setiap Segment_Card tanpa pembatasan industri, sesuai perilaku awal sebelum fitur ini ditambahkan.
4. IF sebuah industri dipilih di Industry_Filter dan tidak ada lead yang memenuhi kriteria gabungan antara industri yang dipilih dan kriteria segmen dari Segment_Card tersebut, THEN THE Segment_Card SHALL menampilkan pesan yang menyebutkan bahwa tidak ada leads yang cocok untuk kombinasi industri dan segmen tersebut, bukan tampilan kosong tanpa keterangan.
5. WHILE pengguna berada di Customer_Segmentation_Tab, THE Industry_Filter SHALL mempertahankan pilihan industri yang terakhir dipilih pengguna.
6. WHEN pengguna berpindah dari Customer_Segmentation_Tab ke tab lain lalu kembali ke Customer_Segmentation_Tab, THE Industry_Filter SHALL mereset pilihannya ke nilai default "Semua Industri".

---

### Kebutuhan 3: Konsistensi Data Industri antara Form Lead dan Filter Segmentasi

**User Story:** Sebagai operator marketing, saya ingin daftar industri di form input lead dan di filter Customer Segmentation selalu sinkron, agar tidak ada industri yang bisa diinput tapi tidak bisa difilter, atau sebaliknya.

#### Kriteria Penerimaan

1. THE System SHALL menggunakan sumber data Industry_List yang sama (satu array tunggal) untuk mengisi opsi `<select>` di Lead_Form maupun opsi dropdown di Industry_Filter, sehingga keduanya selalu konsisten.
2. WHEN sebuah nilai industri baru ditambahkan ke Industry_List, THE System SHALL secara otomatis memunculkan industri tersebut di Lead_Form dan di Industry_Filter tanpa memerlukan perubahan kode di dua tempat terpisah.
3. THE Backend_Leads_Endpoint SHALL menerima nilai industri yang terdapat dalam Industry_List sebagai nilai valid untuk parameter query `?industry=`, dengan mencocokkan nilai tersebut menggunakan perbandingan string case-sensitive secara langsung terhadap nilai yang tersimpan di basis data.
4. WHEN pengguna memilih satu nilai industri dari Industry_Filter di Customer_Segmentation_Tab, THE System SHALL mengembalikan hanya leads yang nilai industrinya cocok secara tepat (exact match, case-sensitive) dengan nilai yang dipilih, dalam waktu tidak lebih dari 3 detik sejak permintaan dikirim.
5. IF parameter query `?industry=` berisi nilai yang tidak terdapat dalam Industry_List, THEN THE Backend_Leads_Endpoint SHALL menolak permintaan tersebut dan mengembalikan respons error yang mengindikasikan nilai industri tidak valid, tanpa memproses atau mengembalikan data leads apapun.
