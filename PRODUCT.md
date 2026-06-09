# Product

## Register

product

## Users

Petugas/Admin koperasi dan tim proyek SPK. Konteks pemakaian: bekerja di depan layar desktop, fokus pada input data penilaian pakar dan membaca hasil perhitungan untuk mengambil keputusan strategi penanganan kredit bermasalah. Mereka bukan pengguna teknis tingkat tinggi; antarmuka harus jelas, tidak membuat ragu, dan memandu langkah demi langkah.

## Product Purpose

SPK Koperasi adalah Sistem Pendukung Keputusan berbasis metode AHP (pembobotan kriteria) dan WP (perankingan alternatif). Tujuannya memberi rekomendasi strategi penanganan kredit bermasalah yang objektif dan dapat dipertanggungjawabkan. Sukses berarti: petugas dapat memodelkan kriteria/alternatif/kondisi, mengisi penilaian pakar, dan membaca ranking rekomendasi beserta detail perhitungannya dengan percaya diri, tanpa kebingungan UI.

## Brand Personality

Tenang, presisi, kredibel. Terasa seperti perkakas analitik profesional — bukan aplikasi trading kripto, bukan template admin generik. Tone tulisan Bahasa Indonesia yang lugas dan membantu. Angka dan tabel adalah bintang utama; kromnya minimal agar data menonjol.

## Anti-references

- Klon Binance / dashboard crypto-trading (kuning neon di atas hitam pekat) — terlalu "loud", tidak cocok untuk konteks koperasi/akademik.
- Template admin Bootstrap generik dengan kartu mengambang, bayangan tebal, dan gradien.
- "AI slop": spacing tak konsisten, alignment meliuk, dropdown native tanpa gaya, tombol tanpa konfirmasi untuk aksi destruktif.

## Design Principles

1. **Data dulu, krom belakangan.** Permukaan netral, satu aksen tunggal. Angka memakai tabular figures dan rata kanan agar mudah dibandingkan.
2. **Konsistensi adalah fitur.** Satu skala spacing, satu set radius, satu komponen untuk tiap pola (semua dropdown identik, semua tombol kembali identik). Tidak ada elemen yang "meliuk".
3. **Tidak ada aksi tanpa umpan balik.** Setiap aksi yang mengubah/menghapus data meminta konfirmasi; setiap aksi sukses/gagal memberi notifikasi.
4. **Pandu, jangan biarkan tersesat.** Empty state jelas, langkah berikutnya selalu terlihat, status kelengkapan eksplisit.
5. **Hormati keterbacaan.** Kontras teks memenuhi WCAG AA; tidak ada teks abu pudar di atas latar pudar.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Body text >= 4.5:1, teks besar >= 3:1, placeholder >= 4.5:1. Focus ring terlihat pada semua elemen interaktif. Mendukung navigasi keyboard penuh pada dropdown dan dialog. Hormati `prefers-reduced-motion`. Mendukung mode terang dan gelap dengan kontras setara.
