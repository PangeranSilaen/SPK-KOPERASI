/**
 * Format tanggal ke format Indonesia yang ringkas, mis. "9 Jun 2026, 23.40".
 */
export function formatDateId(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
