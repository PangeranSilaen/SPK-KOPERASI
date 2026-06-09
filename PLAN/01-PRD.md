# 01 - PRD: SPK Koperasi AHP-WP

## 1. Ringkasan Produk

Nama aplikasi: **SPK Koperasi**

Nama repository GitHub: **SPK-KOPERASI**

Aplikasi ini adalah website Sistem Pendukung Keputusan untuk membantu petugas koperasi menentukan rekomendasi strategi penanganan kredit bermasalah berdasarkan kondisi nasabah. Sistem tidak menyimpan data nasabah. Sistem hanya menyimpan model SPK, data pakar, kriteria, alternatif strategi, kondisi nasabah, penilaian AHP, penilaian WP, dan hasil perhitungan.

Metode yang digunakan:

1. **AHP** untuk menentukan bobot kriteria.
2. **WP** untuk menghitung ranking alternatif strategi.

Bahasa antarmuka aplikasi wajib **Bahasa Indonesia**. Istilah teknis boleh tetap memakai Bahasa Inggris jika istilah tersebut umum digunakan, misalnya `login`, `dashboard`, `import`, `export`, `AHP`, `WP`, `pairwise comparison`, dan `consistency ratio`.

---

## 2. Latar Belakang

Petugas koperasi membutuhkan alat bantu pengambilan keputusan yang lebih objektif dan konsisten untuk menentukan strategi penanganan kredit bermasalah. Karena mitra tidak memungkinkan untuk menyimpan data nasabah di sistem, maka aplikasi dibuat sebagai alat SPK berbasis model. Pengguna cukup memilih kondisi nasabah, lalu sistem menampilkan ranking strategi berdasarkan data penilaian pakar.

Sistem harus mendukung perubahan model, misalnya jika ada kriteria baru, alternatif baru, kondisi baru, atau expert baru. Agar data lama tidak rusak, sistem wajib memiliki konsep **Model SPK** dengan status versi.

---

## 3. Tujuan Produk

1. Menyediakan website SPK yang dapat menghitung rekomendasi strategi penanganan kredit bermasalah.
2. Mengimplementasikan metode AHP untuk pembobotan kriteria.
3. Mengimplementasikan metode WP untuk perankingan alternatif strategi.
4. Memudahkan admin mengelola kriteria, alternatif strategi, kondisi nasabah, expert, dan penilaian.
5. Mendukung import data awal dari file XLSX.
6. Menyediakan detail perhitungan agar hasil dapat dipertanggungjawabkan dalam laporan akhir dan demo.
7. Menyediakan versioning melalui Model SPK agar perubahan data tidak merusak model lama.

---

## 4. Non-Goals

Fitur berikut tidak perlu dibuat pada versi utama:

1. Penyimpanan data nasabah nyata.
2. Sistem kolektor kredit atau CRM koperasi.
3. Integrasi dengan database koperasi asli.
4. Role kompleks seperti super admin, petugas, auditor, dan user eksternal.
5. Machine learning atau prediksi risiko kredit.
6. Subkriteria, kecuali developer menambahkannya sebagai pengembangan opsional setelah fitur utama selesai.

---

## 5. Pengguna dan Role

### 5.1 Pengguna

Aplikasi dipakai oleh petugas/admin koperasi atau tim proyek SPK.

### 5.2 Role

Aplikasi mendukung banyak akun, tetapi semua akun memiliki role yang sama.

Role tunggal:

```text
Petugas/Admin
```

Petugas/Admin dapat:

1. Login.
2. Mengelola Model SPK.
3. Mengelola expert.
4. Mengelola kriteria.
5. Mengelola alternatif strategi.
6. Mengelola kondisi nasabah.
7. Mengisi perbandingan berpasangan AHP.
8. Mengisi nilai strategi WP.
9. Menghitung AHP dan WP.
10. Melihat hasil ranking.
11. Mengimport data XLSX.
12. Mengexport hasil.

---

## 6. Konsep Utama: Model SPK

### 6.1 Definisi

**Model SPK** adalah satu versi lengkap dari data dan perhitungan SPK. Satu Model SPK berisi:

1. Expert.
2. Kriteria.
3. Alternatif strategi.
4. Kondisi nasabah.
5. Data pairwise AHP.
6. Data nilai strategi WP.
7. Hasil perhitungan.

### 6.2 Status Model SPK

Model SPK memiliki tiga status:

| Status | Arti |
|---|---|
| Draf | Masih dapat diedit dan belum digunakan sebagai model utama. |
| Aktif | Model yang digunakan untuk rekomendasi utama. |
| Arsip | Model lama yang tidak digunakan, tetapi tetap dapat dilihat. |

Aturan:

1. Hanya boleh ada satu Model SPK berstatus **Aktif**.
2. Model berstatus **Aktif** tidak boleh diedit langsung.
3. Jika ingin mengubah model aktif, user harus menduplikasinya menjadi model **Draf**.
4. Import XLSX selalu membuat Model SPK baru, bukan menimpa model aktif.
5. Model Draf hanya dapat dipublish menjadi Aktif jika data minimal valid dan perhitungan AHP konsisten.

### 6.3 Alur Versi

```text
Model SPK v1 Aktif
↓
Admin duplikat model
↓
Model SPK v2 Draf
↓
Admin mengubah kriteria / alternatif / kondisi / expert / nilai
↓
Sistem validasi kelengkapan
↓
Sistem hitung ulang AHP-WP
↓
Admin publish model
↓
Model SPK v1 menjadi Arsip, Model SPK v2 menjadi Aktif
```

---

## 7. Data Default Awal

Developer boleh membuat seed awal dengan data berikut agar aplikasi langsung bisa digunakan untuk demo. Data ini bukan pengganti import spreadsheet, tetapi sebagai fallback agar aplikasi tidak kosong.

### 7.1 Kriteria

| Kode | Nama Kriteria | Jenis |
|---|---|---|
| C1 | Peluang keberhasilan | benefit |
| C2 | Risiko kerugian koperasi | cost |
| C3 | Kecepatan penyelesaian | benefit |
| C4 | Dampak hubungan anggota | benefit |
| C5 | Kesesuaian hukum | benefit |
| C6 | Biaya penanganan | cost |

### 7.2 Alternatif Strategi

| Kode | Nama Alternatif |
|---|---|
| A1 | Surat peringatan |
| A2 | Penagihan intensif |
| A3 | Rescheduling / penjadwalan ulang |
| A4 | Restrukturisasi cicilan |
| A5 | Pendekatan persuasif |
| A6 | Mediasi dan negosiasi |
| A7 | Hapus buku |

### 7.3 Kondisi Nasabah

| Kode | Nama Kondisi |
|---|---|
| K1 | Keterlambatan pembayaran |
| K2 | Penurunan kemampuan membayar |
| K3 | Penurunan kondisi usaha |
| K4 | Kesulitan ekonomi sementara |
| K5 | Nasabah tidak kooperatif / sulit dihubungi |

### 7.4 Expert Default

```text
Nama: Bapak Ahmad Suryanto
Jabatan: Manajer Kredit Koperasi Pusaka 78
Pengalaman: 12 tahun
```

### 7.5 Akun Login Default

```text
Email: admin@spk.test
Password: admin12345
```

Password harus di-hash di database. Jangan simpan password plaintext.

---

## 8. Fitur Utama

### 8.1 Login

Fitur:

1. User login dengan email dan password.
2. Session tersimpan aman.
3. User yang belum login tidak boleh mengakses dashboard.
4. Banyak akun didukung, tetapi semua akun memiliki role yang sama.

Acceptance criteria:

1. Login berhasil jika email dan password valid.
2. Login gagal menampilkan pesan Bahasa Indonesia.
3. Logout menghapus session.
4. Password tidak pernah ditampilkan ulang.

---

### 8.2 Dashboard

Dashboard menampilkan:

1. Model SPK Aktif.
2. Jumlah Model SPK Draf dan Arsip.
3. Jumlah kriteria, alternatif, kondisi, dan expert pada model aktif.
4. Status kelengkapan data.
5. Ringkasan hasil rekomendasi per kondisi.
6. Tombol cepat: `Buat Model SPK`, `Import XLSX`, `Lihat Hasil`.

Acceptance criteria:

1. Jika belum ada model aktif, dashboard menampilkan ajakan membuat atau import model.
2. Jika ada model aktif, dashboard menampilkan ringkasan model.
3. Semua teks UI memakai Bahasa Indonesia.

---

### 8.3 Manajemen Model SPK

Fitur:

1. List Model SPK.
2. Buat Model SPK baru.
3. Duplikat Model SPK.
4. Edit Model SPK berstatus Draf.
5. Publish Model SPK Draf menjadi Aktif.
6. Arsipkan Model SPK.
7. Lihat detail Model SPK lama.

Field Model SPK:

1. Nama model.
2. Deskripsi.
3. Status: Draf, Aktif, Arsip.
4. Tanggal dibuat.
5. Tanggal diperbarui.
6. Pembuat.

Acceptance criteria:

1. Model Aktif tidak dapat diedit langsung.
2. Tombol edit pada Model Aktif diarahkan ke fitur `Duplikat menjadi Draf`.
3. Publish hanya berhasil jika data lengkap dan CR valid.
4. Saat satu model dipublish, model aktif sebelumnya otomatis menjadi Arsip.

---

### 8.4 Manajemen Expert

Fitur:

1. Tambah expert.
2. Edit expert.
3. Nonaktifkan expert.
4. Tandai expert sebagai aktif digunakan pada perhitungan default.
5. Melihat status kelengkapan penilaian AHP dan WP per expert.

Field expert:

1. Nama expert.
2. Jabatan.
3. Lama pengalaman.
4. Status aktif/tidak aktif.
5. Catatan opsional.

Acceptance criteria:

1. Expert yang belum lengkap penilaiannya tetap boleh disimpan.
2. Expert yang belum lengkap harus diberi label `Belum lengkap`.
3. Perhitungan hanya bisa memakai expert yang data wajibnya lengkap.
4. Admin bisa memilih satu atau beberapa expert untuk simulasi hasil.

---

### 8.5 Manajemen Kriteria

Fitur:

1. Tambah kriteria.
2. Edit kriteria.
3. Nonaktifkan kriteria.
4. Atur urutan kriteria.
5. Pilih jenis kriteria: benefit atau cost.

Aturan:

1. Kode kriteria unik dalam satu Model SPK.
2. Nama kriteria wajib diisi.
3. Jenis hanya boleh `benefit` atau `cost`.
4. Jika kriteria baru ditambahkan, sistem harus menandai bahwa data AHP dan WP perlu dilengkapi ulang.

Acceptance criteria:

1. Sistem otomatis menghitung jumlah pairwise yang dibutuhkan.
2. Sistem menampilkan checklist data yang belum lengkap.
3. Model tidak bisa dipublish jika ada kriteria aktif yang belum memiliki data penilaian lengkap.

---

### 8.6 Manajemen Alternatif Strategi

Fitur:

1. Tambah alternatif strategi.
2. Edit alternatif strategi.
3. Nonaktifkan alternatif strategi.
4. Atur urutan alternatif.

Aturan:

1. Kode alternatif unik dalam satu Model SPK.
2. Jika alternatif baru ditambahkan, sistem harus meminta nilai strategi untuk semua kombinasi kondisi dan kriteria.

Acceptance criteria:

1. Alternatif baru tidak merusak hasil model lama karena perubahan hanya dilakukan pada Model Draf.
2. Model tidak bisa dipublish jika nilai strategi alternatif baru belum lengkap.

---

### 8.7 Manajemen Kondisi Nasabah

Fitur:

1. Tambah kondisi nasabah.
2. Edit kondisi nasabah.
3. Nonaktifkan kondisi nasabah.
4. Atur urutan kondisi.

Aturan:

1. Sistem tidak menyimpan identitas nasabah.
2. Kondisi hanya menjadi kategori pengambilan keputusan.
3. Jika kondisi baru ditambahkan, sistem meminta nilai strategi untuk seluruh alternatif dan kriteria.

Acceptance criteria:

1. Kondisi baru otomatis muncul di halaman input nilai strategi.
2. Model tidak bisa dipublish jika nilai untuk kondisi baru belum lengkap.

---

### 8.8 Input AHP

Fitur:

1. UI perbandingan berpasangan antar kriteria.
2. Skala Saaty 1 sampai 9.
3. Pilihan sisi yang lebih penting: kiri, sama, kanan.
4. Input dilakukan per expert.
5. Sistem menghitung matriks AHP, bobot kriteria, lambda max, CI, dan CR.
6. Sistem menampilkan status konsistensi.

UI harus dibuat interaktif dan mudah dipahami. Contoh:

```text
Mana yang lebih penting?

[C1 - Peluang keberhasilan]  vs  [C2 - Risiko kerugian koperasi]

Pilihan:
( ) Kiri lebih penting
( ) Sama penting
( ) Kanan lebih penting

Intensitas:
[1 sampai 9]
```

Acceptance criteria:

1. Untuk n kriteria, sistem membuat n(n-1)/2 input pairwise.
2. Jika expert lebih dari satu, admin bisa memilih expert yang digunakan.
3. Jika beberapa expert dipilih, nilai pairwise digabung memakai geometric mean.
4. Jika CR lebih dari 0,1, sistem memberi peringatan bahwa penilaian belum konsisten.
5. Semua hasil angka ditampilkan 3 angka di belakang koma.

---

### 8.9 Input Nilai Strategi WP

Fitur:

1. Input nilai strategi skala 1 sampai 5.
2. Input dilakukan per expert.
3. Nilai diberikan untuk kombinasi kondisi, alternatif, dan kriteria.
4. UI menyediakan filter kondisi dan expert.
5. Sistem menampilkan progress kelengkapan input.

Contoh struktur input:

```text
Kondisi: K1 - Keterlambatan pembayaran
Expert: Bapak Ahmad Suryanto

Alternatif A1 - Surat peringatan
C1 Peluang keberhasilan: 4
C2 Risiko kerugian koperasi: 2
C3 Kecepatan penyelesaian: 5
...
```

Acceptance criteria:

1. Nilai hanya boleh 1, 2, 3, 4, atau 5.
2. Jika nilai belum lengkap, sistem menampilkan daftar yang belum diisi.
3. Jika beberapa expert dipilih, nilai strategi digabung menggunakan rata-rata aritmetika.
4. Perhitungan WP tidak boleh berjalan jika ada nilai wajib yang kosong untuk expert terpilih.

---

### 8.10 Simulasi dan Hasil Rekomendasi

Fitur:

1. Pilih Model SPK.
2. Pilih kondisi nasabah.
3. Pilih expert yang dilibatkan.
4. Hitung rekomendasi.
5. Tampilkan ranking alternatif strategi.
6. Tampilkan detail perhitungan AHP dan WP.

Hasil yang ditampilkan:

1. Bobot kriteria.
2. CR AHP.
3. Matriks penilaian strategi.
4. Nilai vektor S.
5. Nilai vektor V.
6. Ranking akhir.
7. Rekomendasi strategi terbaik.
8. Indikator tie jika ranking sama.

Acceptance criteria:

1. User bisa menghitung hasil dengan 1 expert, sebagian expert, atau semua expert.
2. Jika nilai hasil sama, sistem menampilkan ranking sama, bukan memaksa tie-breaker.
3. Semua output numerik tampil 3 desimal.
4. Sistem menyimpan riwayat calculation run opsional untuk audit dan export.

---

### 8.11 Import XLSX

Fitur:

1. Upload file `.xlsx`.
2. Sistem membaca data pairwise AHP dan nilai strategi WP.
3. Sistem menampilkan preview data sebelum menyimpan.
4. Import selalu membuat Model SPK baru.
5. User mengisi nama Model SPK baru sebelum menyimpan.

Sheet utama yang perlu didukung:

1. `dummy_ahp_pairwise_long`
2. `Copy of dummy_strategy_long`

Developer boleh menambahkan alias nama sheet agar importer lebih fleksibel.

Preview import minimal menampilkan:

1. Jumlah expert.
2. Jumlah kriteria.
3. Jumlah alternatif.
4. Jumlah kondisi.
5. Jumlah pairwise AHP.
6. Jumlah nilai strategi WP.
7. Daftar error validasi jika ada.

Acceptance criteria:

1. File XLSX valid dapat diimport menjadi Model SPK Draf.
2. Import tidak boleh menimpa Model SPK Aktif.
3. Jika struktur file tidak cocok, sistem menampilkan pesan error Bahasa Indonesia.
4. Setelah import, sistem menghitung ulang AHP dan WP di backend.

---

### 8.12 Export Hasil

Fitur utama:

1. Export hasil ranking ke PDF.

Fitur opsional:

1. Export hasil ke XLSX.

Isi export PDF:

1. Nama Model SPK.
2. Kondisi nasabah yang dipilih.
3. Expert yang digunakan.
4. Bobot kriteria.
5. CR AHP.
6. Tabel nilai S dan V.
7. Ranking strategi.
8. Rekomendasi akhir.
9. Tanggal export.

Acceptance criteria:

1. PDF dapat dibuka.
2. Semua label berbahasa Indonesia.
3. Angka tampil 3 desimal.
4. Export tidak mengubah data perhitungan.

---

## 9. Prinsip UI/UX

### 9.1 Bahasa

Gunakan Bahasa Indonesia untuk seluruh label utama.

Contoh label:

| Gunakan | Hindari |
|---|---|
| Model SPK | Workspace |
| Kriteria | Criteria |
| Alternatif Strategi | Alternatives |
| Kondisi Nasabah | Conditions |
| Perbandingan Berpasangan | Pairwise Comparison sebagai label utama |
| Hasil Perankingan | Ranking Result |
| Rasio Konsistensi / CR | Consistency Ratio saja |

### 9.2 Desain Visual

Gunakan:

1. `shadcn/ui` sebagai basis komponen.
2. `DESIGN.md` Binance sebagai sumber arahan visual.
3. Dark mode style yang rapi dan profesional.
4. Warna aksen Binance yellow untuk aksi utama.
5. Card, table, tabs, badge, dialog, form, dan sidebar yang konsisten.

Instruksi khusus:

```text
Use shadcn/ui as the component base.
Use DESIGN.md as the visual design source of truth.
Customize shadcn components to match Binance-style tokens from DESIGN.md.
Do not add random UI libraries unless necessary.
```

### 9.3 Halaman Utama

Minimal halaman:

1. Login.
2. Dashboard.
3. Daftar Model SPK.
4. Detail Model SPK.
5. Expert.
6. Kriteria.
7. Alternatif Strategi.
8. Kondisi Nasabah.
9. Input AHP.
10. Input Nilai Strategi.
11. Simulasi Perhitungan.
12. Hasil Rekomendasi.
13. Import Data.
14. Export Hasil.

---

## 10. Success Metrics

Aplikasi dianggap berhasil jika:

1. User dapat login.
2. User dapat membuat Model SPK.
3. User dapat mengimport XLSX menjadi Model SPK baru.
4. User dapat mengelola kriteria, alternatif, kondisi, dan expert.
5. User dapat mengisi AHP dan melihat CR.
6. User dapat mengisi nilai strategi WP.
7. User dapat memilih expert yang dilibatkan.
8. User dapat memilih kondisi nasabah dan melihat ranking strategi.
9. Hasil tampil dengan 3 angka di belakang koma.
10. Model lama tetap aman saat ada perubahan data.

---

## 11. MVP dan Nice-to-Have

### 11.1 MVP Wajib

1. Login.
2. Model SPK dengan status Draf, Aktif, Arsip.
3. CRUD expert.
4. CRUD kriteria.
5. CRUD alternatif strategi.
6. CRUD kondisi nasabah.
7. Input AHP per expert.
8. Input nilai strategi per expert.
9. Multi-expert selector.
10. Hitung AHP dan WP di backend.
11. Detail hasil perhitungan.
12. Import XLSX menjadi Model SPK baru.
13. UI Bahasa Indonesia.
14. Presisi tampilan 3 desimal.

### 11.2 Nice-to-Have

1. Export PDF.
2. Export XLSX.
3. Riwayat calculation run.
4. Grafik bobot kriteria.
5. Grafik ranking alternatif.
6. Template XLSX kosong untuk diunduh.
7. Audit log perubahan model.

---

## 12. Catatan Untuk Coding Agent

1. Jangan menyimpan data nasabah.
2. Jangan menghitung hasil dari formula spreadsheet.
3. Spreadsheet hanya sumber data mentah.
4. Semua perhitungan AHP dan WP harus dibuat di backend.
5. Import XLSX selalu membuat Model SPK baru.
6. UI wajib Bahasa Indonesia.
7. Output angka tampil 3 angka di belakang koma, tetapi perhitungan internal memakai presisi penuh.
8. Perubahan data besar harus dilakukan pada Model Draf, bukan Model Aktif.
9. Gunakan shadcn/ui dan DESIGN.md Binance.
10. Jangan membuat fitur role kompleks.
