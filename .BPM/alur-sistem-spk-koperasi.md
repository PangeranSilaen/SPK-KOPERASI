# Alur Sistem SPK Koperasi (AHP-WP)

Dokumen ini menjelaskan alur kerja sistem **SPK Koperasi** secara berurutan, dari pengguna login sampai memperoleh hasil perankingan strategi dan mengekspornya. Tujuan dokumen adalah menjadi acuan pembuatan **Business Process Model Notation (BPMN)**.

Sistem dipakai oleh **Petugas/Admin koperasi** (hanya satu jenis peran). Metode yang dipakai: **AHP** untuk menghitung bobot kriteria dan **WP (Weighted Product)** untuk merangking alternatif strategi. Sistem tidak menyimpan data pribadi nasabah selain nama nasabah pada riwayat kalkulasi.

> Catatan untuk pembuat BPMN: dalam dokumen ini disebut tiga "pihak" yang dapat dijadikan swimlane bila diperlukan:
> - **Petugas** — orang yang berinteraksi dengan layar.
> - **Sistem (Aplikasi/Backend)** — logika server, perhitungan, validasi.
> - **Basis Data** — penyimpanan Model SPK beserta seluruh datanya.

---

## Ringkasan Alur Besar (End-to-End)

Urutan utama dari awal sampai akhir:

1. Petugas membuka aplikasi dan **Login**.
2. Sistem memverifikasi kredensial dan membuat **sesi (session)**.
3. Petugas masuk ke **Dashboard**.
4. Petugas **menyiapkan Model SPK** melalui salah satu dari dua jalur:
   - Jalur A: **Buat Model manual** lalu mengisi data lewat antarmuka.
   - Jalur B: **Import file XLSX** yang otomatis membuat Model SPK baru beserta datanya.
5. Petugas melengkapi **data master**: Expert, Kriteria, Alternatif Strategi, Kondisi Nasabah (hanya untuk model berstatus Draf).
6. Petugas mengisi **penilaian AHP** (perbandingan berpasangan antar kriteria) per expert.
7. Petugas mengisi **nilai strategi WP** (skala 1-5) per expert untuk setiap kombinasi kondisi, alternatif, dan kriteria.
8. Petugas membuka halaman **Simulasi**, memilih kondisi nasabah dan expert yang dilibatkan, lalu menekan **Hitung Rekomendasi**.
9. Sistem menjalankan perhitungan **AHP** (bobot kriteria + rasio konsistensi) lalu **WP** (vektor S, vektor V, perankingan).
10. Sistem menampilkan **hasil perankingan** beserta rekomendasi strategi terbaik dan detail perhitungan.
11. Sistem menyimpan **riwayat kalkulasi** (termasuk nama nasabah bila diisi).
12. Petugas dapat **Export PDF** hasil rekomendasi.
13. (Opsional) Petugas dapat menjalankan **lifecycle Model SPK**: duplikat, publish menjadi Aktif, atau arsipkan.

Diagram BPMN end-to-end mengikuti urutan di atas, dengan beberapa **gerbang keputusan (gateway)** yang dijelaskan rinci pada bagian-bagian berikut.

---

## Bagian 1 — Login dan Sesi

**Tujuan:** memastikan hanya pengguna terautentikasi yang dapat mengakses sistem.

Langkah:

1. Petugas membuka halaman **Login** dan mengisi **email** dan **password**.
2. Petugas menekan tombol **Masuk**.
3. Sistem memvalidasi format input (email dan password wajib diisi).
4. Sistem mencari akun berdasarkan email, lalu mencocokkan password dengan password yang tersimpan (password disimpan dalam bentuk hash, tidak pernah disimpan apa adanya).
5. **Gerbang keputusan: kredensial valid?**
   - **Tidak valid** (email tidak ditemukan atau password salah): sistem menampilkan pesan kesalahan berbahasa Indonesia ("Email atau password tidak sesuai.") dan pengguna tetap di halaman Login.
   - **Valid**: sistem membuat **sesi** (cookie sesi yang aman, berlaku 7 hari) lalu mengarahkan pengguna ke **Dashboard**.

Catatan:

- Setiap halaman terproteksi dan setiap aksi yang mengubah data **selalu memeriksa sesi** terlebih dahulu. Jika sesi tidak ada atau tidak valid, pengguna otomatis diarahkan kembali ke halaman Login.
- **Logout** menghapus sesi lalu mengarahkan pengguna ke halaman Login.

---

## Bagian 2 — Dashboard

**Tujuan:** titik awal navigasi setelah login, menampilkan status Model SPK Aktif.

Langkah:

1. Setelah login, Petugas berada di **Dashboard**.
2. Sistem mengecek apakah ada **Model SPK berstatus Aktif**.
3. **Gerbang keputusan: ada Model Aktif?**
   - **Belum ada**: Dashboard menampilkan ajakan untuk **Buat Model SPK** atau **Import XLSX**.
   - **Ada**: Dashboard menampilkan ringkasan model aktif (jumlah kriteria, alternatif, kondisi, expert, status kelengkapan) beserta tombol cepat **Lihat Hasil** dan **Import Data**.
4. Dari sini Petugas memilih jalur penyiapan Model SPK (Bagian 3).

---

## Bagian 3 — Menyiapkan Model SPK (Dua Jalur)

Sebuah **Model SPK** adalah satu versi lengkap berisi expert, kriteria, alternatif strategi, kondisi nasabah, data penilaian AHP, data nilai strategi WP, dan hasil perhitungan. Model SPK punya tiga status: **Draf** (dapat diedit), **Aktif** (model utama, tidak dapat diedit langsung), dan **Arsip** (model lama).

Penyiapan model dapat dilakukan melalui dua jalur. Keduanya menghasilkan model berstatus **Draf**.

### Jalur A — Buat Model Manual

1. Petugas membuka **Daftar Model SPK**.
2. Petugas menekan **Buat Model**, mengisi nama dan deskripsi model.
3. Sistem memeriksa sesi, memvalidasi input, lalu membuat satu **Model SPK baru berstatus Draf**.
4. Sistem mengarahkan Petugas ke halaman **Detail Model** model baru tersebut.
5. Selanjutnya Petugas mengisi data master secara manual (lihat Bagian 4).

### Jalur B — Import XLSX

1. Petugas membuka halaman **Import Data** dan memilih file `.xlsx`.
2. Sistem membaca file dan mencari **dua sheet** yang dibutuhkan:
   - Sheet perbandingan AHP (nama acuan: `dummy_ahp_pairwise_long`).
   - Sheet nilai strategi (nama acuan: `Copy of dummy_strategy_long`).
   Sistem cukup fleksibel: pencocokan sheet dilakukan berdasarkan nama persis, lalu nama yang mengandung kata kunci, lalu kecocokan header kolom.
3. **Gerbang keputusan: struktur file cocok?**
   - **Tidak cocok** (salah satu sheet tidak ditemukan): sistem menampilkan pesan kesalahan berbahasa Indonesia. Proses berhenti.
   - **Cocok**: sistem mem-parsing dan memvalidasi isi, lalu menampilkan **preview**: jumlah expert, kriteria, alternatif, kondisi, jumlah pairwise AHP, jumlah nilai strategi, serta daftar error/peringatan bila ada.
4. **Gerbang keputusan: ada error validasi?**
   - **Ada error**: tombol konfirmasi import tidak tersedia. Petugas harus memperbaiki file. (Peringatan/`warning` tidak memblokir, hanya catatan.)
   - **Tidak ada error**: Petugas mengisi **nama Model SPK** baru lalu menekan **Konfirmasi Import**.
5. Sistem membuat **Model SPK baru berstatus Draf** beserta seluruh data turunannya dalam satu transaksi (bila ada kegagalan, semua dibatalkan).
6. Sistem mengarahkan Petugas ke halaman **Detail Model** baru.

> Aturan penting: **Import selalu membuat Model SPK baru** dan tidak pernah menimpa model Aktif.

---

## Bagian 4 — Melengkapi Data Master (Model Draf)

**Tujuan:** mengisi seluruh komponen Model SPK sebelum perhitungan. Semua langkah di bagian ini hanya bisa dilakukan pada model berstatus **Draf**.

> **Gerbang keputusan global (berlaku untuk semua aksi edit di bagian ini): status model = Draf?**
> Jika model berstatus **Aktif** atau **Arsip**, semua aksi edit ditolak dengan pesan "Duplikat model terlebih dahulu". Petugas harus menduplikat model menjadi Draf lebih dulu (lihat Bagian 8).

Dari halaman **Detail Model**, Petugas mengelola empat jenis data master. Urutan logis pengisian:

1. **Expert** — daftar pakar penilai. Field: nama, jabatan, lama pengalaman, status aktif/nonaktif, catatan opsional. Expert yang penilaiannya belum lengkap tetap boleh disimpan, tetapi diberi label "Belum lengkap".
2. **Kriteria** — field: kode (unik per model), nama, jenis (**benefit** atau **cost**), urutan, status aktif. Jenis menentukan arah perhitungan WP (benefit makin besar makin baik, cost makin kecil makin baik).
3. **Alternatif Strategi** — pilihan strategi penanganan kredit. Field: kode (unik per model), nama, urutan, status aktif.
4. **Kondisi Nasabah** — kategori situasi nasabah (bukan identitas). Field: kode (unik per model), nama, urutan, status aktif.

Untuk setiap aksi tambah/ubah/hapus pada data master, Sistem melakukan: cek sesi, validasi input, pastikan model masih Draf, simpan ke basis data, lalu mencatat aktivitas ke **log audit**.

**Gerbang keputusan: kode/nama duplikat?** Bila kode atau nama yang dimasukkan sudah dipakai dalam model yang sama, Sistem menolak dengan pesan "kode/nama sudah digunakan".

---

## Bagian 5 — Input Penilaian AHP (Perbandingan Berpasangan)

**Tujuan:** mengumpulkan penilaian tingkat kepentingan antar kriteria dari setiap expert, sebagai bahan menghitung bobot kriteria.

Langkah:

1. Petugas membuka halaman **AHP** pada model Draf.
2. Sistem menampilkan seluruh pasangan kriteria. Untuk **n kriteria** terdapat **n(n-1)/2** perbandingan.
3. Untuk setiap pasangan, Petugas memilih sisi yang lebih penting (**Kiri**, **Sama**, atau **Kanan**) dan **intensitas** pada skala Saaty **1 sampai 9**.
4. Input dilakukan **per expert**.
5. Petugas menyimpan. Sistem mengecek sesi, memvalidasi (bila pilihan "Sama" maka intensitas dipaksa 1), memastikan model Draf, lalu menyimpan data perbandingan.

> Anotasi konversi pilihan menjadi nilai rasio matriks:
> - "Kiri n" → nilai rasio = **n** (kriteria kiri n kali lebih penting).
> - "Kanan n" → nilai rasio = **1/n**.
> - "Sama" (atau "Sama 1") → nilai rasio = **1**.

---

## Bagian 6 — Input Nilai Strategi WP

**Tujuan:** mengumpulkan penilaian performa setiap alternatif strategi terhadap setiap kriteria, untuk setiap kondisi nasabah.

Langkah:

1. Petugas membuka halaman **Nilai Strategi** pada model Draf.
2. Sistem menampilkan matriks input untuk kombinasi **kondisi × alternatif × kriteria**, dengan filter kondisi dan expert.
3. Petugas mengisi **nilai skala 1 sampai 5** untuk tiap sel, dilakukan **per expert**.
4. Sistem menampilkan progres kelengkapan input.
5. Petugas menyimpan. Sistem mengecek sesi, memvalidasi (nilai harus 1-5), memastikan model Draf, lalu menyimpan.

> Jumlah nilai yang dibutuhkan tiap expert = **jumlah alternatif × jumlah kriteria × jumlah kondisi**. Bila ada yang kosong untuk expert terpilih, perhitungan WP tidak dapat dijalankan untuk expert tersebut.

---

## Bagian 7 — Simulasi, Perhitungan, dan Hasil Perankingan

Ini adalah inti sistem: tahap di mana semua data diolah menjadi rekomendasi.

### 7.1 Memulai Simulasi

1. Petugas membuka halaman **Simulasi** pada model.
2. Petugas memilih **kondisi nasabah** (wajib, default kondisi pertama).
3. Petugas mengisi **nama nasabah** (opsional, untuk riwayat dan dokumen export).
4. Petugas mencentang **expert** yang dilibatkan. Secara default yang terpilih hanyalah expert yang aktif dan datanya lengkap.
   - **Gerbang keputusan: expert layak dipilih?** Expert yang nonaktif atau penilaiannya belum lengkap akan dinonaktifkan (tidak dapat dicentang).
5. Petugas menekan **Hitung Rekomendasi**.

### 7.2 Pemeriksaan Kelengkapan (sebelum menghitung)

Sistem memeriksa kelengkapan data sebelum menghitung. **Gerbang keputusan: data cukup untuk dihitung?**

- Tidak ada expert terpilih → perhitungan dibatalkan dengan pesan kesalahan.
- Jumlah kriteria kurang dari 2, atau tidak ada alternatif → dibatalkan.
- Penilaian AHP atau nilai strategi WP belum lengkap untuk salah satu expert terpilih → dibatalkan dengan daftar bagian yang kurang.

Jika semua syarat terpenuhi, Sistem lanjut menghitung.

### 7.3 Perhitungan AHP (Bobot Kriteria)

1. **Agregasi multi-expert** — bila lebih dari satu expert, nilai perbandingan tiap pasangan digabung dengan **rata-rata geometrik (geometric mean)**: `GM = (∏ nilai)^(1/jumlah_expert)`. Bila hanya satu expert, nilai dipakai apa adanya.
2. **Bangun matriks perbandingan** — diagonal = 1, sel kebalikan = 1/nilai. Sel yang tidak terisi dianggap 1.
3. **Normalisasi matriks** — tiap sel dibagi jumlah kolomnya.
4. **Bobot kriteria (priority vector)** — rata-rata tiap baris matriks ternormalisasi.
5. **Uji konsistensi:**
   - Hitung lambda maks (λmax), lalu indeks konsistensi `CI = (λmax − n) / (n − 1)`.
   - Rasio konsistensi `CR = CI / RI`, dengan RI dari tabel Random Index sesuai n.
   - **Gerbang keputusan: ukuran n?** Bila **n ≤ 2**, secara definisi `CI = 0` dan `CR = 0` (selalu konsisten).
   - **Gerbang keputusan: CR ≤ 0,1?** Bila CR ≤ 0,1 → ditandai **konsisten**; bila CR > 0,1 → ditandai **tidak konsisten**.

> Penting untuk BPMN: gerbang CR ≤ 0,1 bersifat **informatif, bukan penghenti**. Bila CR > 0,1, perhitungan tetap dilanjutkan dan hasil tetap ditampilkan, hanya diberi penanda peringatan "tidak konsisten" pada hasil dan riwayat.

### 7.4 Perhitungan WP (Perankingan Alternatif)

1. **Agregasi multi-expert** — bila lebih dari satu expert, nilai strategi tiap sel digabung dengan **rata-rata aritmetika** (bukan geometrik, karena nilai 1-5 bersifat rating).
2. **Pangkat (eksponen) tiap kriteria** — diambil dari bobot kriteria hasil AHP:
   - Kriteria **benefit** → eksponen **positif** (`+bobot`).
   - Kriteria **cost** → eksponen **negatif** (`−bobot`).
3. **Vektor S** — untuk setiap alternatif: `S = ∏ (nilai_kriteria ^ eksponen_kriteria)`.
4. **Vektor V** — normalisasi: `V = S / ΣS` (jumlah seluruh S). Nilai V terbesar = paling direkomendasikan.
5. **Perankingan** — alternatif diurutkan menurun berdasarkan V.
   - **Gerbang keputusan: ada hasil seri (tie)?** Bila selisih V antar dua alternatif **≤ 0,0005**, keduanya diberi **peringkat sama** (sistem tidak memaksa pemecah seri).
6. **Rekomendasi terbaik** = alternatif dengan peringkat 1 (V tertinggi).

### 7.5 Menampilkan dan Menyimpan Hasil

1. Sistem menampilkan: kartu **rekomendasi strategi terbaik**, penanda **CR konsisten/tidak konsisten**, tabel **ranking alternatif**, serta detail perhitungan AHP (bobot kriteria, CR) dan WP (vektor S, vektor V).
2. Semua angka ditampilkan dengan **3 angka di belakang koma**.
3. Sistem menyimpan **Riwayat Kalkulasi (CalculationRun)**: model, kondisi, nama nasabah (bila diisi), daftar expert terpilih, hasil AHP/WP, CR, dan status konsistensi.

> Catatan privasi: nama nasabah adalah PII. Aksesnya dibatasi sesi, tidak ditampilkan publik, dan dokumen export wajib dijaga kerahasiaannya.

---

## Bagian 8 — Lifecycle Model SPK (Sub-Proses Versioning)

Sub-proses ini menjaga agar perubahan data tidak merusak model yang sedang dipakai. Aturan utama: **hanya boleh ada satu Model Aktif**, dan **Model Aktif tidak boleh diedit langsung**.

### 8.1 Duplikat Model

1. Petugas menekan **Duplikat** pada sebuah model (biasanya model Aktif yang ingin diubah).
2. Sistem menyalin seluruh data model (expert, kriteria, alternatif, kondisi, penilaian AHP, nilai strategi) ke sebuah **Model baru berstatus Draf**.
3. Petugas mengedit model Draf hasil duplikat tersebut (kembali ke Bagian 4-6).

### 8.2 Publish Model (Draf → Aktif)

1. Petugas menekan **Publish menjadi Aktif** pada model Draf.
2. **Gerbang keputusan: data valid untuk dipublish?** Sistem memeriksa: minimal 2 kriteria aktif, minimal 1 alternatif aktif, minimal 1 kondisi aktif, minimal 1 expert aktif, dan setiap expert aktif sudah lengkap penilaian AHP dan WP-nya.
   - **Tidak lolos**: publish ditolak dengan daftar masalah yang harus diperbaiki.
   - **Lolos**: dalam satu transaksi, **Model Aktif lama otomatis menjadi Arsip**, dan model ini menjadi **Aktif**.

### 8.3 Arsipkan dan Pulihkan

- **Arsipkan**: model diubah menjadi status Arsip.
- **Pulihkan (restore)**: hanya model berstatus **Arsip** yang dapat dikembalikan menjadi **Draf**.

### 8.4 Hapus Model

- **Gerbang keputusan: status model = Aktif?** Model berstatus **Aktif tidak dapat dihapus** (harus diarsipkan dulu). Model Draf atau Arsip dapat dihapus; menghapus model akan menghapus seluruh data turunannya.

---

## Bagian 9 — Export Hasil (PDF)

**Tujuan:** mencetak hasil rekomendasi sebagai dokumen PDF.

Langkah:

1. Dari halaman hasil Simulasi, Petugas menekan **Export PDF**.
2. Sistem memeriksa sesi (bila tidak valid → ditolak).
3. **Gerbang keputusan: parameter lengkap?** Parameter wajib: model, kondisi, dan daftar expert. Bila kurang → permintaan ditolak.
4. Sistem **menghitung ulang** rekomendasi (agar PDF mencerminkan data terkini), lalu merender dokumen PDF.
5. Isi PDF: nama Model SPK, kondisi nasabah, nama nasabah (bila ada), expert yang digunakan, bobot kriteria, CR, tabel nilai S dan V, ranking strategi, rekomendasi akhir, dan tanggal export. Semua angka 3 desimal.
6. Berkas PDF dikirim ke browser untuk dilihat/diunduh. Export tidak mengubah data perhitungan.

> Catatan: Export XLSX adalah fitur opsional dan saat ini belum diimplementasikan; export tersedia dalam bentuk PDF.

---

## Lampiran A — Ringkasan Gerbang Keputusan (Gateway) untuk BPMN

| No | Lokasi dalam alur | Pertanyaan gerbang | Jika ya / lolos | Jika tidak / gagal |
|----|-------------------|--------------------|-----------------|--------------------|
| 1 | Login | Kredensial valid? | Buat sesi → Dashboard | Tampilkan pesan kesalahan, tetap di Login |
| 2 | Semua halaman/aksi | Sesi valid? | Lanjut | Arahkan ke Login / tolak akses |
| 3 | Dashboard | Ada Model Aktif? | Tampilkan ringkasan | Tampilkan ajakan buat/import model |
| 4 | Import XLSX | Struktur file cocok (2 sheet)? | Tampilkan preview | Tampilkan error, berhenti |
| 5 | Import XLSX | Ada error validasi? | Sembunyikan tombol konfirmasi | Boleh konfirmasi → buat model Draf |
| 6 | Data master | Status model = Draf? | Boleh diedit | Tolak, minta duplikat dulu |
| 7 | Data master | Kode/nama duplikat? | Tolak (sudah dipakai) | Simpan |
| 8 | Simulasi | Expert aktif & lengkap? | Boleh dicentang | Checkbox dinonaktifkan |
| 9 | Hitung | Data cukup (expert, kriteria≥2, alternatif, AHP & WP lengkap)? | Lanjut hitung | Batalkan dengan daftar kekurangan |
| 10 | AHP | Ukuran n ≤ 2? | CR = 0 (konsisten) | Hitung CR = CI/RI |
| 11 | AHP | CR ≤ 0,1? | Tandai konsisten | Tandai tidak konsisten (tetap lanjut) |
| 12 | WP | Selisih V ≤ 0,0005? | Peringkat sama (tie) | Peringkat berurutan |
| 13 | Publish | Data valid untuk publish? | Aktif lama → Arsip; model ini → Aktif | Tolak dengan daftar masalah |
| 14 | Hapus model | Status = Aktif? | Tolak penghapusan | Boleh dihapus |
| 15 | Export PDF | Parameter lengkap & sesi valid? | Render & kirim PDF | Tolak (400/401) |

---

## Lampiran B — Istilah Penting

- **Model SPK**: satu versi lengkap data + perhitungan SPK. Status: Draf, Aktif, Arsip.
- **Expert**: pakar yang memberi penilaian AHP dan nilai strategi WP.
- **Kriteria**: faktor penilaian, berjenis benefit (makin besar makin baik) atau cost (makin kecil makin baik).
- **Alternatif Strategi**: pilihan strategi penanganan kredit yang dirangking.
- **Kondisi Nasabah**: kategori situasi nasabah (bukan identitas pribadi).
- **AHP (Analytic Hierarchy Process)**: metode menghitung bobot kriteria dari perbandingan berpasangan.
- **CR (Consistency Ratio / Rasio Konsistensi)**: ukuran konsistensi penilaian AHP; ambang valid ≤ 0,1.
- **WP (Weighted Product)**: metode perankingan alternatif menggunakan perkalian berpangkat bobot.
- **Vektor S**: hasil perkalian berpangkat tiap alternatif. **Vektor V**: S yang dinormalisasi; V terbesar = rekomendasi terbaik.
- **Tie**: dua alternatif berperingkat sama bila selisih V ≤ 0,0005.
- **Riwayat Kalkulasi**: catatan hasil perhitungan, termasuk nama nasabah, untuk audit dan export.
