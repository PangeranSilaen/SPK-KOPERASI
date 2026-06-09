export type RankedItem = {
  alternativeId: string;
  code: string;
  name: string;
  s: number;
  v: number;
};

export type Ranking = RankedItem & { rank: number };

export const TIE_TOLERANCE = 0.0005;

/**
 * Tetapkan ranking berdasarkan nilai V (terbesar = ranking 1).
 * Tie: jika selisih V dengan item sebelumnya <= TIE_TOLERANCE, ranking sama.
 * Ranking berikutnya = posisi (index + 1) sesuai SRS §6.5.
 *
 * Contoh: V = [0.40, 0.2388, 0.2384, 0.12]
 *   rank 1: 0.40
 *   rank 2: 0.2388 (tie dengan berikutnya)
 *   rank 2: 0.2384
 *   rank 4: 0.12
 */
export function assignRankings(items: RankedItem[]): Ranking[] {
  const sorted = [...items].sort((a, b) => b.v - a.v);
  const rankings: Ranking[] = [];

  for (let i = 0; i < sorted.length; i++) {
    let rank = i + 1;
    if (i > 0) {
      const prev = sorted[i - 1];
      if (Math.abs(sorted[i].v - prev.v) <= TIE_TOLERANCE) {
        // Tie dengan item sebelumnya: pakai ranking yang sama.
        rank = rankings[i - 1].rank;
      }
    }
    rankings.push({ ...sorted[i], rank });
  }

  return rankings;
}
