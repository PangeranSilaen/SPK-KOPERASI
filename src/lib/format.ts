/**
 * Format angka untuk tampilan dan export: selalu 3 desimal.
 * Perhitungan internal tetap memakai presisi penuh; gunakan helper ini
 * hanya pada lapisan tampilan/export.
 */
export function formatDecimal(value: number): string {
  if (!Number.isFinite(value)) return "-";
  return value.toFixed(3);
}
