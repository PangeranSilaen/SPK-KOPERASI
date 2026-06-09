/**
 * Jumlah perbandingan pairwise AHP yang wajib diisi untuk n kriteria aktif.
 * Rumus: n(n-1)/2.
 */
export function getRequiredAhpPairCount(criteriaCount: number): number {
  if (criteriaCount < 2) return 0;
  return (criteriaCount * (criteriaCount - 1)) / 2;
}

/**
 * Jumlah nilai strategi WP yang wajib diisi.
 * Rumus: jumlah kondisi * jumlah alternatif * jumlah kriteria (semua aktif).
 */
export function getRequiredStrategyScoreCount(
  conditionCount: number,
  alternativeCount: number,
  criterionCount: number,
): number {
  return conditionCount * alternativeCount * criterionCount;
}
