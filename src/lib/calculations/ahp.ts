import { getRI } from "@/lib/ri-table";

export type AhpCriterion = {
  id: string;
  code: string;
  name: string;
};

export type AhpPairwiseInput = {
  leftCriterionId: string;
  rightCriterionId: string;
  ratioValue: number;
};

export type AhpWeight = {
  criterionId: string;
  code: string;
  name: string;
  weight: number;
};

export type AhpResult = {
  matrix: number[][];
  columnSums: number[];
  normalizedMatrix: number[][];
  weights: AhpWeight[];
  lambdaMax: number;
  ci: number;
  cr: number;
  isConsistent: boolean;
};

/**
 * Gabungkan nilai pairwise dari beberapa expert memakai geometric mean.
 * Setiap elemen array luar adalah daftar pairwise satu expert.
 * Jika hanya satu expert, nilai dikembalikan apa adanya.
 */
export function aggregatePairwiseByGeometricMean(
  expertInputs: AhpPairwiseInput[][],
): AhpPairwiseInput[] {
  const valid = expertInputs.filter((list) => list && list.length > 0);
  if (valid.length === 0) return [];
  if (valid.length === 1) return [...valid[0]];

  // Kelompokkan berdasarkan pasangan kiri-kanan.
  const map = new Map<string, { left: string; right: string; values: number[] }>();
  for (const list of valid) {
    for (const item of list) {
      const key = `${item.leftCriterionId}__${item.rightCriterionId}`;
      const entry = map.get(key);
      if (entry) {
        entry.values.push(item.ratioValue);
      } else {
        map.set(key, {
          left: item.leftCriterionId,
          right: item.rightCriterionId,
          values: [item.ratioValue],
        });
      }
    }
  }

  const result: AhpPairwiseInput[] = [];
  for (const { left, right, values } of map.values()) {
    const product = values.reduce((acc, v) => acc * v, 1);
    const gm = Math.pow(product, 1 / values.length);
    result.push({ leftCriterionId: left, rightCriterionId: right, ratioValue: gm });
  }
  return result;
}

/**
 * Bentuk matriks pairwise n x n.
 * Diagonal = 1. Untuk pasangan (kiri,kanan) yang diisi, matriks[kiri][kanan] = ratio,
 * dan reciprocal matriks[kanan][kiri] = 1/ratio.
 */
export function buildPairwiseMatrix(
  criteria: AhpCriterion[],
  comparisons: AhpPairwiseInput[],
): number[][] {
  const n = criteria.length;
  const index = new Map<string, number>();
  criteria.forEach((c, i) => index.set(c.id, i));

  const matrix: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );

  for (const cmp of comparisons) {
    const i = index.get(cmp.leftCriterionId);
    const j = index.get(cmp.rightCriterionId);
    if (i === undefined || j === undefined || i === j) continue;
    const ratio = cmp.ratioValue;
    matrix[i][j] = ratio;
    matrix[j][i] = ratio === 0 ? 0 : 1 / ratio;
  }

  // Pastikan sel yang belum terisi (tidak ada perbandingan) bernilai 1 agar tidak nol.
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j && matrix[i][j] === 0) {
        matrix[i][j] = 1;
      }
    }
  }

  return matrix;
}

/**
 * Hitung AHP penuh: normalisasi, bobot, lambdaMax, CI, CR.
 * Tidak melakukan rounding internal.
 */
export function calculateAhp(criteria: AhpCriterion[], matrix: number[][]): AhpResult {
  const n = criteria.length;

  // Total kolom.
  const columnSums = Array.from({ length: n }, (_, j) => {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += matrix[i][j];
    return sum;
  });

  // Matriks normalisasi.
  const normalizedMatrix = matrix.map((row) =>
    row.map((val, j) => (columnSums[j] === 0 ? 0 : val / columnSums[j])),
  );

  // Bobot = rata-rata baris matriks normalisasi.
  const weightValues = normalizedMatrix.map((row) => {
    const sum = row.reduce((acc, v) => acc + v, 0);
    return sum / n;
  });

  const weights: AhpWeight[] = criteria.map((c, i) => ({
    criterionId: c.id,
    code: c.code,
    name: c.name,
    weight: weightValues[i],
  }));

  // Weighted sum vector Aw = A * w.
  const aw = matrix.map((row) => row.reduce((acc, val, j) => acc + val * weightValues[j], 0));

  // Consistency vector cv_i = Aw_i / w_i, lalu lambdaMax = rata-rata cv.
  let lambdaMax: number;
  if (n === 0) {
    lambdaMax = 0;
  } else {
    const cv = aw.map((awi, i) => (weightValues[i] === 0 ? 0 : awi / weightValues[i]));
    lambdaMax = cv.reduce((acc, v) => acc + v, 0) / n;
  }

  // CI dan CR.
  let ci = 0;
  let cr = 0;
  if (n > 2) {
    ci = (lambdaMax - n) / (n - 1);
    const ri = getRI(n);
    cr = ri === 0 ? 0 : ci / ri;
  } else {
    // n <= 2: konsisten secara definisi.
    ci = 0;
    cr = 0;
  }

  const isConsistent = cr <= 0.1;

  return {
    matrix,
    columnSums,
    normalizedMatrix,
    weights,
    lambdaMax,
    ci,
    cr,
    isConsistent,
  };
}
