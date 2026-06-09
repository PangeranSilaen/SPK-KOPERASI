# 02 - SRS: Spesifikasi Kebutuhan Sistem SPK Koperasi

## 1. Identifikasi Sistem

Nama sistem: **SPK Koperasi**

Jenis sistem: Website Sistem Pendukung Keputusan berbasis metode AHP-WP.

Tujuan sistem: Memberikan rekomendasi strategi penanganan kredit bermasalah berdasarkan kondisi nasabah tanpa menyimpan data pribadi nasabah.

Bahasa antarmuka: Bahasa Indonesia.

---

## 2. Definisi Istilah

| Istilah | Definisi |
|---|---|
| Model SPK | Satu versi lengkap data dan konfigurasi perhitungan SPK. |
| Expert | Pakar atau pihak koperasi yang memberikan penilaian. |
| Kriteria | Faktor penilaian untuk mengevaluasi alternatif strategi. |
| Alternatif Strategi | Pilihan tindakan penanganan kredit bermasalah. |
| Kondisi Nasabah | Kategori situasi nasabah, bukan data personal nasabah. |
| AHP | Analytical Hierarchy Process, metode untuk menentukan bobot kriteria. |
| WP | Weighted Product, metode untuk menentukan ranking alternatif. |
| Pairwise Comparison | Perbandingan berpasangan antar kriteria. |
| CR | Consistency Ratio, indikator konsistensi penilaian AHP. |
| Benefit | Kriteria yang semakin tinggi nilainya semakin baik. |
| Cost | Kriteria yang semakin rendah nilainya semakin baik. |

---

## 3. Kebutuhan Fungsional

### FR-001 Login

Sistem harus menyediakan login email dan password.

Detail:

1. User memasukkan email dan password.
2. Sistem memvalidasi kredensial.
3. Jika valid, user diarahkan ke dashboard.
4. Jika tidak valid, sistem menampilkan pesan error Bahasa Indonesia.

Prioritas: Wajib.

---

### FR-002 Logout

Sistem harus menyediakan fitur logout.

Detail:

1. User klik tombol logout.
2. Session dihapus.
3. User diarahkan ke halaman login.

Prioritas: Wajib.

---

### FR-003 Manajemen Akun

Sistem harus mendukung banyak akun dengan role yang sama.

Detail:

1. Semua user memiliki hak akses yang sama.
2. Tidak perlu role bertingkat.
3. Password harus disimpan dalam bentuk hash.

Prioritas: Wajib.

---

### FR-004 Manajemen Model SPK

Sistem harus menyediakan CRUD Model SPK.

Field:

1. Nama model.
2. Deskripsi.
3. Status: Draf, Aktif, Arsip.
4. Created at.
5. Updated at.

Aturan:

1. Hanya satu model yang boleh Aktif.
2. Model Aktif tidak boleh diedit langsung.
3. Model Aktif harus diduplikat menjadi Draf sebelum diedit.
4. Model Draf dapat dipublish menjadi Aktif jika valid.
5. Model lama otomatis menjadi Arsip ketika model baru dipublish.

Prioritas: Wajib.

---

### FR-005 Duplikasi Model SPK

Sistem harus dapat menduplikasi Model SPK.

Detail:

1. User memilih model sumber.
2. Sistem menyalin expert, kriteria, alternatif, kondisi, pairwise AHP, dan nilai strategi.
3. Model hasil duplikasi berstatus Draf.
4. Nama default: `Salinan dari {nama model}`.

Prioritas: Wajib.

---

### FR-006 Manajemen Expert

Sistem harus menyediakan CRUD expert dalam Model SPK.

Field:

1. Nama expert.
2. Jabatan expert.
3. Lama pengalaman.
4. Status aktif digunakan.
5. Catatan.

Aturan:

1. Expert berada dalam konteks Model SPK.
2. Expert dapat dinonaktifkan tanpa menghapus data historis.
3. Sistem menampilkan status kelengkapan penilaian per expert.

Prioritas: Wajib.

---

### FR-007 Manajemen Kriteria

Sistem harus menyediakan CRUD kriteria dalam Model SPK.

Field:

1. Kode kriteria.
2. Nama kriteria.
3. Jenis kriteria: benefit atau cost.
4. Urutan.
5. Status aktif.

Validasi:

1. Kode wajib unik dalam satu Model SPK.
2. Nama wajib diisi.
3. Jenis kriteria wajib benefit atau cost.

Dampak perubahan:

1. Jika kriteria baru ditambahkan, sistem harus menandai AHP dan WP sebagai belum lengkap.
2. Jumlah pairwise AHP harus dihitung ulang.
3. Nilai strategi untuk kriteria baru harus diisi untuk seluruh kondisi dan alternatif.

Prioritas: Wajib.

---

### FR-008 Manajemen Alternatif Strategi

Sistem harus menyediakan CRUD alternatif strategi.

Field:

1. Kode alternatif.
2. Nama alternatif.
3. Deskripsi.
4. Urutan.
5. Status aktif.

Validasi:

1. Kode wajib unik dalam satu Model SPK.
2. Nama wajib diisi.

Dampak perubahan:

1. Jika alternatif baru ditambahkan, sistem harus meminta nilai strategi untuk seluruh kondisi dan kriteria.
2. AHP tidak perlu diulang jika hanya alternatif yang berubah.

Prioritas: Wajib.

---

### FR-009 Manajemen Kondisi Nasabah

Sistem harus menyediakan CRUD kondisi nasabah.

Field:

1. Kode kondisi.
2. Nama kondisi.
3. Deskripsi.
4. Urutan.
5. Status aktif.

Validasi:

1. Kode wajib unik dalam satu Model SPK.
2. Nama wajib diisi.

Dampak perubahan:

1. Jika kondisi baru ditambahkan, sistem harus meminta nilai strategi untuk seluruh alternatif dan kriteria.
2. AHP tidak perlu diulang jika hanya kondisi yang berubah.

Prioritas: Wajib.

---

### FR-010 Input Pairwise AHP

Sistem harus menyediakan form perbandingan berpasangan AHP.

Detail:

1. Input dilakukan per expert.
2. Sistem otomatis membuat pasangan kriteria aktif.
3. Skala menggunakan Saaty 1 sampai 9.
4. User memilih apakah kriteria kiri lebih penting, sama penting, atau kriteria kanan lebih penting.
5. Sistem menyimpan nilai rasio aktual.

Jumlah input pairwise:

```text
n(n-1)/2
```

Contoh:

```text
6 kriteria = 6(6-1)/2 = 15 pasangan
7 kriteria = 7(7-1)/2 = 21 pasangan
```

Prioritas: Wajib.

---

### FR-011 Perhitungan AHP

Sistem harus menghitung bobot kriteria dari input AHP.

Output:

1. Matriks pairwise.
2. Total kolom.
3. Matriks normalisasi.
4. Bobot prioritas.
5. Lambda max.
6. CI.
7. CR.
8. Status konsistensi.

Aturan:

1. Jika satu expert dipilih, sistem memakai nilai expert tersebut.
2. Jika beberapa expert dipilih, sistem menggabungkan nilai pairwise memakai geometric mean.
3. Data internal memakai presisi penuh.
4. Tampilan UI memakai 3 angka di belakang koma.
5. CR harus kurang dari atau sama dengan 0,1 agar dianggap konsisten.

Prioritas: Wajib.

---

### FR-012 Multi-Expert Selector

Sistem harus menyediakan selector expert untuk perhitungan.

Detail:

1. User dapat memilih 1 expert.
2. User dapat memilih beberapa expert.
3. User dapat memilih semua expert aktif.
4. Sistem menampilkan expert yang belum lengkap dan tidak memperbolehkannya dipilih untuk perhitungan.

Tujuan:

1. Membandingkan hasil jika hanya 1 expert digunakan.
2. Membandingkan hasil jika beberapa expert digabung.
3. Melihat dampak penambahan expert terhadap bobot dan ranking.

Prioritas: Wajib.

---

### FR-013 Input Nilai Strategi WP

Sistem harus menyediakan input nilai strategi.

Kombinasi data:

```text
Expert x Kondisi x Alternatif x Kriteria
```

Nilai:

1. Skala 1 sampai 5.
2. Hanya bilangan bulat.
3. Tidak boleh kosong jika expert akan dipakai dalam perhitungan.

Prioritas: Wajib.

---

### FR-014 Perhitungan WP

Sistem harus menghitung ranking alternatif strategi dengan metode WP.

Input:

1. Bobot kriteria dari AHP.
2. Jenis kriteria benefit/cost.
3. Nilai strategi per kondisi, alternatif, dan kriteria.
4. Expert yang dipilih.

Output:

1. Nilai agregat strategi per kriteria.
2. Nilai vektor S.
3. Nilai vektor V.
4. Ranking alternatif.
5. Rekomendasi strategi terbaik.

Aturan:

1. Jika satu expert dipilih, sistem memakai nilai strategi dari expert tersebut.
2. Jika beberapa expert dipilih, sistem menggabungkan nilai strategi dengan rata-rata aritmetika.
3. Kriteria benefit memakai bobot positif.
4. Kriteria cost memakai bobot negatif.
5. Ranking ditentukan dari nilai V terbesar.
6. Jika nilai sama dalam toleransi 0,0005, sistem menampilkan ranking sama.

Prioritas: Wajib.

---

### FR-015 Detail Perhitungan

Sistem harus menampilkan detail perhitungan AHP dan WP.

Detail AHP:

1. Matriks pairwise gabungan.
2. Total kolom.
3. Matriks normalisasi.
4. Bobot kriteria.
5. Lambda max.
6. CI.
7. CR.

Detail WP:

1. Matriks nilai strategi sesuai kondisi.
2. Bobot pangkat benefit/cost.
3. Nilai S setiap alternatif.
4. Total S.
5. Nilai V setiap alternatif.
6. Ranking.

Prioritas: Wajib.

---

### FR-016 Import XLSX

Sistem harus menyediakan import file XLSX.

Aturan:

1. Import XLSX selalu membuat Model SPK baru.
2. Import tidak boleh menimpa Model SPK aktif.
3. Sistem harus menampilkan preview sebelum data disimpan.
4. Sistem harus membaca data mentah, bukan formula hasil spreadsheet.

Sheet utama:

1. `dummy_ahp_pairwise_long`
2. `Copy of dummy_strategy_long`

Jika nama sheet berbeda, developer boleh membuat deteksi berdasarkan header.

Prioritas: Wajib.

---

### FR-017 Validasi Import XLSX

Sistem harus memvalidasi file XLSX sebelum menyimpan.

Validasi minimal:

1. File harus `.xlsx`.
2. Ada sheet pairwise AHP.
3. Ada sheet nilai strategi WP.
4. Kode kriteria tidak kosong.
5. Nama kriteria tidak kosong.
6. Jenis kriteria hanya benefit/cost.
7. Kode alternatif tidak kosong.
8. Kode kondisi tidak kosong.
9. Nilai AHP valid.
10. Nilai strategi berada dalam 1 sampai 5.
11. Tidak ada kombinasi wajib yang duplikat.
12. Tidak ada kombinasi wajib yang hilang.

Prioritas: Wajib.

---

### FR-018 Export PDF

Sistem harus menyediakan export hasil ke PDF.

Isi PDF:

1. Nama Model SPK.
2. Status model.
3. Kondisi nasabah.
4. Expert yang digunakan.
5. Bobot kriteria.
6. CR.
7. Nilai S dan V.
8. Ranking.
9. Rekomendasi akhir.
10. Tanggal export.

Prioritas: Nice-to-have tetapi dianjurkan.

---

### FR-019 Export XLSX

Sistem boleh menyediakan export hasil ke XLSX.

Isi XLSX:

1. Sheet ringkasan.
2. Sheet bobot AHP.
3. Sheet hasil WP.
4. Sheet ranking.

Prioritas: Opsional.

---

## 4. Kebutuhan Non-Fungsional

### NFR-001 Bahasa

Semua UI utama harus memakai Bahasa Indonesia.

Istilah teknis boleh tetap dipakai jika umum, tetapi harus diberi konteks.

Contoh:

```text
Rasio Konsistensi (CR)
Perbandingan Berpasangan (Pairwise Comparison)
```

---

### NFR-002 Presisi Angka

Aturan:

1. Perhitungan internal memakai presisi penuh JavaScript number.
2. Tampilan UI memakai 3 angka di belakang koma.
3. Export memakai 3 angka di belakang koma.
4. Jangan membulatkan pada setiap langkah internal.

Contoh format:

```text
0.367
1.245
12.300
```

---

### NFR-003 Keamanan

1. Password harus di-hash.
2. Route dashboard harus dilindungi session.
3. Endpoint mutasi data harus memvalidasi session.
4. Import file harus membatasi tipe file `.xlsx`.
5. Validasi input menggunakan schema validation.

---

### NFR-004 Maintainability

1. Gunakan TypeScript.
2. Pisahkan logic perhitungan dari UI.
3. Buat fungsi utilitas AHP dan WP yang dapat dites.
4. Hindari hardcode perhitungan di komponen React.
5. Gunakan Prisma untuk akses database.

---

### NFR-005 UI/UX

1. Gunakan shadcn/ui sebagai base component.
2. Gunakan DESIGN.md Binance sebagai sumber gaya visual.
3. Gunakan layout dashboard yang bersih.
4. Gunakan tabel yang mudah dibaca.
5. Beri progress kelengkapan input.
6. Beri empty state yang jelas.
7. Beri pesan error Bahasa Indonesia.

---

## 5. Spesifikasi Perhitungan AHP

### 5.1 Input Pairwise

Untuk setiap pasangan kriteria i dan j, sistem menyimpan nilai rasio:

```text
a_ij
```

Jika kriteria i lebih penting daripada j dengan intensitas 5:

```text
a_ij = 5
```

Jika kriteria j lebih penting daripada i dengan intensitas 5:

```text
a_ij = 1/5
```

Jika sama penting:

```text
a_ij = 1
```

Matriks reciprocal:

```text
a_ji = 1 / a_ij
```

Diagonal matriks:

```text
a_ii = 1
```

---

### 5.2 Aggregasi Multi-Expert AHP

Jika ada m expert terpilih, nilai pairwise digabung dengan geometric mean:

```text
GM_ij = (x1 * x2 * ... * xm)^(1/m)
```

Jika hanya satu expert:

```text
GM_ij = x1
```

---

### 5.3 Normalisasi Matriks

Total kolom:

```text
column_sum_j = sum(a_ij) untuk semua i
```

Normalisasi:

```text
r_ij = a_ij / column_sum_j
```

Bobot prioritas:

```text
w_i = rata-rata baris i pada matriks normalisasi
```

---

### 5.4 Lambda Max

Weighted sum vector:

```text
Aw = A * w
```

Consistency vector:

```text
cv_i = Aw_i / w_i
```

Lambda max:

```text
lambda_max = rata-rata cv_i
```

---

### 5.5 CI dan CR

Consistency Index:

```text
CI = (lambda_max - n) / (n - 1)
```

Consistency Ratio:

```text
CR = CI / RI
```

Jika n kurang dari atau sama dengan 2, CR dianggap 0.

Tabel RI:

| n | RI |
|---|---:|
| 1 | 0.00 |
| 2 | 0.00 |
| 3 | 0.58 |
| 4 | 0.90 |
| 5 | 1.12 |
| 6 | 1.24 |
| 7 | 1.32 |
| 8 | 1.41 |
| 9 | 1.45 |
| 10 | 1.49 |
| 11 | 1.51 |
| 12 | 1.48 |
| 13 | 1.56 |
| 14 | 1.57 |
| 15 | 1.59 |

Status:

```text
CR <= 0.1 = Konsisten
CR > 0.1 = Tidak konsisten
```

---

## 6. Spesifikasi Perhitungan WP

### 6.1 Input WP

Nilai strategi:

```text
x_ij
```

Keterangan:

1. i = alternatif.
2. j = kriteria.
3. x = nilai strategi 1 sampai 5.

Jika beberapa expert dipilih, agregasi nilai strategi memakai rata-rata aritmetika:

```text
x_ij = (x_ij_expert1 + x_ij_expert2 + ... + x_ij_expertm) / m
```

Alasan: nilai strategi adalah rating kecocokan skala 1 sampai 5, bukan nilai rasio pairwise.

---

### 6.2 Bobot Benefit dan Cost

Bobot AHP:

```text
w_j
```

Jika benefit:

```text
p_j = w_j
```

Jika cost:

```text
p_j = -w_j
```

---

### 6.3 Nilai S

Untuk setiap alternatif:

```text
S_i = product(x_ij ^ p_j)
```

Keterangan:

1. Benefit memakai pangkat positif.
2. Cost memakai pangkat negatif.
3. Semua nilai x harus lebih dari 0.

---

### 6.4 Nilai V

Total S:

```text
sumS = sum(S_i)
```

Nilai preferensi:

```text
V_i = S_i / sumS
```

Ranking:

```text
Semakin besar V_i, semakin baik alternatif.
```

---

### 6.5 Tie Ranking

Jika selisih nilai V antar alternatif lebih kecil atau sama dengan 0,0005, sistem menganggap nilai tersebut tie.

Contoh:

```text
A4 = 0.23841
A6 = 0.23878
selisih = 0.00037
ranking sama
```

Tampilan:

```text
Ranking 1: A4 Restrukturisasi cicilan
Ranking 1: A6 Mediasi dan negosiasi
Ranking 3: A1 Surat peringatan
```

---

## 7. Kelengkapan Data

### 7.1 Kelengkapan Pairwise AHP

Untuk setiap expert aktif:

```text
jumlah_pairwise_wajib = n_kriteria_aktif * (n_kriteria_aktif - 1) / 2
```

Expert dianggap lengkap AHP jika jumlah pairwise valid sama dengan jumlah wajib.

---

### 7.2 Kelengkapan Nilai Strategi

Untuk setiap expert aktif:

```text
jumlah_nilai_wajib = jumlah_kondisi_aktif * jumlah_alternatif_aktif * jumlah_kriteria_aktif
```

Expert dianggap lengkap WP jika jumlah nilai valid sama dengan jumlah wajib.

---

### 7.3 Dampak Tambah Data

| Perubahan | AHP perlu ulang? | WP perlu nilai baru? |
|---|---|---|
| Tambah kriteria | Ya | Ya, untuk semua kondisi dan alternatif. |
| Tambah alternatif | Tidak | Ya, untuk semua kondisi dan kriteria. |
| Tambah kondisi | Tidak | Ya, untuk semua alternatif dan kriteria. |
| Tambah expert | Ya, untuk expert baru | Ya, untuk expert baru. |
| Ubah jenis kriteria | Tidak selalu | Perhitungan WP harus diulang. |

---

## 8. Spesifikasi Import XLSX

### 8.1 Prinsip Import

1. Import XLSX membuat Model SPK baru.
2. Import tidak mengubah model lama.
3. Sistem membaca data mentah, bukan formula spreadsheet.
4. Setelah import, backend menghitung ulang AHP dan WP.
5. User wajib memberi nama Model SPK baru.

---

### 8.2 Sheet Pairwise AHP

Nama sheet utama pada spreadsheet asli saat ini:

```text
dummy_ahp_pairwise_long
```

Header asli yang harus didukung parser:

| Kolom asli | Wajib | Keterangan |
|---|---|---|
| `nama_expert` | Ya | Nama expert/pakar. |
| `jabatan_expert` | Tidak | Jabatan expert. |
| `lama_pengalaman` | Tidak | Lama pengalaman expert. |
| `kriteria_kiri_id` | Tidak | ID kriteria kiri dari spreadsheet. Boleh dipakai untuk mapping, tetapi sistem harus tetap mengandalkan kode. |
| `kriteria_kiri_kode` | Ya | Kode kriteria kiri, contoh `C1`. |
| `kriteria_kiri_nama` | Ya | Nama kriteria kiri. |
| `kriteria_kanan_id` | Tidak | ID kriteria kanan dari spreadsheet. Boleh dipakai untuk mapping, tetapi sistem harus tetap mengandalkan kode. |
| `kriteria_kanan_kode` | Ya | Kode kriteria kanan, contoh `C2`. |
| `kriteria_kanan_nama` | Ya | Nama kriteria kanan. |
| `pilihan_form` | Ya | Pilihan perbandingan dari spreadsheet, contoh `Kiri 2`, `Kanan 3`, atau `Sama`. |
| `nilai_ahp` | Ya | Nilai AHP 1 sampai 9. |

Aturan parsing `pilihan_form`:

| Contoh isi | Arti |
|---|---|
| `Kiri 2` | Kriteria kiri lebih penting 2 kali daripada kriteria kanan. Elemen matriks `kiri, kanan = 2`. |
| `Kanan 3` | Kriteria kanan lebih penting 3 kali daripada kriteria kiri. Elemen matriks `kiri, kanan = 1/3`. |
| `Sama` atau `Sama 1` | Kedua kriteria sama penting. Elemen matriks `kiri, kanan = 1`. |

`nilai_ahp` tetap divalidasi 1 sampai 9. Jika `pilihan_form` dan `nilai_ahp` tidak konsisten, tampilkan error validasi sebelum import disimpan.

Parser boleh juga menerima alias kolom untuk fleksibilitas:

| Alias | Dipetakan ke |
|---|---|
| `preferensi` | `pilihan_form` |
| `kiri_kode` | `kriteria_kiri_kode` |
| `kanan_kode` | `kriteria_kanan_kode` |

---

### 8.3 Sheet Nilai Strategi WP

Nama sheet utama pada spreadsheet asli saat ini:

```text
Copy of dummy_strategy_long
```

Header asli yang harus didukung parser:

| Kolom asli | Wajib | Keterangan |
|---|---|---|
| `nama_expert` | Ya | Nama expert/pakar. |
| `jabatan_expert` | Tidak | Jabatan expert. |
| `lama_pengalaman` | Tidak | Lama pengalaman expert. |
| `kondisi_id` | Tidak | ID kondisi dari spreadsheet. Boleh dipakai untuk mapping, tetapi sistem harus tetap mengandalkan kode. |
| `kondisi_kode` | Ya | Kode kondisi, contoh `K1`. |
| `kondisi_nama` | Ya | Nama kondisi nasabah. |
| `alternatif_id` | Tidak | ID alternatif dari spreadsheet. Boleh dipakai untuk mapping, tetapi sistem harus tetap mengandalkan kode. |
| `alternatif_kode` | Ya | Kode alternatif, contoh `A1`. |
| `alternatif_nama` | Ya | Nama alternatif strategi. |
| `kriteria_id` | Tidak | ID kriteria dari spreadsheet. Boleh dipakai untuk mapping, tetapi sistem harus tetap mengandalkan kode. |
| `kriteria_kode` | Ya | Kode kriteria, contoh `C1`. |
| `kriteria_nama` | Ya | Nama kriteria. |
| `jenis_kriteria` | Ya | `benefit` atau `cost`. |
| `nilai` | Ya | Nilai strategi 1 sampai 5. |

Untuk data awal saat ini, jumlah baris data yang diharapkan adalah:

```text
5 kondisi x 7 alternatif x 6 kriteria = 210 baris data
```

Jumlah 210 adalah baris data tanpa header.

---

### 8.4 Preview Import

Setelah user upload file, tampilkan preview:

```text
Nama file: SPK KEL5 TEST.xlsx

Data terbaca:
- Expert: 1
- Kriteria: 6
- Alternatif strategi: 7
- Kondisi nasabah: 5
- Pairwise AHP: 15 baris
- Nilai strategi WP: 210 baris

Status validasi:
- Pairwise AHP lengkap
- Nilai strategi lengkap
- Tidak ada duplikasi
```

Jika ada error:

```text
File belum dapat diimport karena terdapat data yang belum lengkap:
- Baris 12: nilai strategi harus berada antara 1 sampai 5.
- Kriteria C6 belum memiliki jenis benefit/cost.
```

---

## 9. Data Awal yang Harus Didukung

Sistem minimal harus mampu menangani data berikut:

1. 6 kriteria.
2. 7 alternatif strategi.
3. 5 kondisi nasabah.
4. 1 expert awal.
5. 15 pairwise AHP.
6. 210 nilai strategi WP.

Perhitungan jumlah nilai strategi:

```text
5 kondisi x 7 alternatif x 6 kriteria = 210 nilai
```

---

## 10. Pesan Error Bahasa Indonesia

Contoh pesan:

| Kondisi | Pesan |
|---|---|
| Login gagal | Email atau password tidak sesuai. |
| Belum ada model aktif | Belum ada Model SPK aktif. Silakan buat atau import model terlebih dahulu. |
| CR tidak valid | Rasio Konsistensi lebih dari 0,1. Mohon periksa kembali penilaian AHP. |
| Nilai WP kosong | Masih ada nilai strategi yang belum diisi. |
| Import gagal | Format file tidak sesuai. Pastikan file berformat XLSX dan memiliki sheet yang diperlukan. |
| Edit model aktif | Model aktif tidak dapat diedit langsung. Duplikat model terlebih dahulu. |

---

## 11. Acceptance Criteria Sistem

Sistem dinyatakan selesai jika memenuhi seluruh kondisi berikut:

1. Aplikasi dapat dijalankan secara lokal.
2. User dapat login memakai akun seed.
3. User dapat membuat Model SPK.
4. User dapat mengimport XLSX menjadi Model SPK baru.
5. User dapat mengedit Model SPK Draf.
6. User tidak dapat mengedit Model SPK Aktif secara langsung.
7. User dapat mengisi AHP dengan skala Saaty.
8. Sistem menghitung bobot AHP dan CR.
9. User dapat mengisi nilai strategi WP skala 1 sampai 5.
10. User dapat memilih expert yang dilibatkan dalam perhitungan.
11. Sistem menghitung WP dan menampilkan ranking.
12. Sistem menampilkan detail perhitungan.
13. Sistem menampilkan angka 3 desimal.
14. Sistem menampilkan tie ranking jika nilai sama.
15. UI menggunakan Bahasa Indonesia.
16. Desain mengikuti shadcn/ui dan DESIGN.md Binance.
