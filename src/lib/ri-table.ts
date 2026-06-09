/**
 * Tabel Random Index (RI) untuk perhitungan Consistency Ratio AHP.
 * Sumber: SRS §5.5.
 */
export const RI: Record<number, number> = {
  1: 0.0,
  2: 0.0,
  3: 0.58,
  4: 0.9,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
  11: 1.51,
  12: 1.48,
  13: 1.56,
  14: 1.57,
  15: 1.59,
};

/**
 * Ambil nilai RI untuk ordo matriks n.
 * Untuk n <= 2, RI = 0 (CR akan dianggap 0).
 * Untuk n di luar tabel (>15), pakai nilai n=15 sebagai pendekatan.
 */
export function getRI(n: number): number {
  if (n <= 2) return 0;
  if (RI[n] !== undefined) return RI[n];
  return RI[15];
}
