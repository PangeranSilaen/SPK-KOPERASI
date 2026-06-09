import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatDecimal } from "@/lib/format";
import type { RecommendationResult } from "@/server/services/calculation-service";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: {
    marginBottom: 16,
    borderBottom: "2 solid #4f46e5",
    paddingBottom: 8,
  },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 9, color: "#64748b", marginTop: 2 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    color: "#0f172a",
  },
  row: { flexDirection: "row" },
  infoRow: { flexDirection: "row", marginBottom: 2 },
  infoLabel: { width: 130, color: "#64748b" },
  infoValue: { flex: 1, fontFamily: "Helvetica-Bold" },
  table: { borderTop: "1 solid #cbd5e1", marginTop: 4 },
  tr: {
    flexDirection: "row",
    borderBottom: "1 solid #e2e8f0",
    paddingVertical: 3,
  },
  th: {
    flexDirection: "row",
    borderBottom: "1 solid #cbd5e1",
    paddingVertical: 4,
    backgroundColor: "#f1f5f9",
  },
  cell: { flex: 1, paddingHorizontal: 4 },
  cellRight: { flex: 1, paddingHorizontal: 4, textAlign: "right" },
  cellNarrow: { width: 50, paddingHorizontal: 4, textAlign: "center" },
  bold: { fontFamily: "Helvetica-Bold" },
  best: {
    marginTop: 6,
    padding: 8,
    backgroundColor: "#eef2ff",
    border: "1 solid #4f46e5",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    fontSize: 8,
    color: "#94a3b8",
    borderTop: "1 solid #e2e8f0",
    paddingTop: 6,
  },
});

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draf",
  ACTIVE: "Aktif",
  ARCHIVED: "Arsip",
};

export function ResultPdf({
  result,
  exportedAt,
  customerName,
}: {
  result: RecommendationResult;
  exportedAt: string;
  customerName?: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Hasil Rekomendasi SPK Koperasi</Text>
          <Text style={styles.subtitle}>
            Metode AHP-WP - Strategi Penanganan Kredit Bermasalah
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Model SPK</Text>
            <Text style={styles.infoValue}>{result.model.name}</Text>
          </View>
          {customerName ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Nasabah</Text>
              <Text style={styles.infoValue}>{customerName}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status Model</Text>
            <Text style={styles.infoValue}>
              {STATUS_LABEL[result.model.status] ?? result.model.status}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kondisi Nasabah</Text>
            <Text style={styles.infoValue}>
              {result.condition.code} - {result.condition.name}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expert Digunakan</Text>
            <Text style={styles.infoValue}>
              {result.experts.map((e) => e.name).join(", ")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rasio Konsistensi (CR)</Text>
            <Text style={styles.infoValue}>
              {formatDecimal(result.ahp.cr)}{" "}
              {result.ahp.isConsistent ? "(Konsisten)" : "(Tidak konsisten)"}
            </Text>
          </View>
        </View>

        {/* Bobot kriteria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bobot Kriteria (AHP)</Text>
          <View style={styles.th}>
            <Text style={styles.cell}>Kriteria</Text>
            <Text style={styles.cellRight}>Bobot</Text>
          </View>
          {result.ahp.weights.map((w) => (
            <View style={styles.tr} key={w.criterionId}>
              <Text style={styles.cell}>
                {w.code} - {w.name}
              </Text>
              <Text style={styles.cellRight}>{formatDecimal(w.weight)}</Text>
            </View>
          ))}
        </View>

        {/* Nilai S dan V + ranking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nilai S, V, dan Ranking (WP)</Text>
          <View style={styles.th}>
            <Text style={styles.cellNarrow}>Rank</Text>
            <Text style={styles.cell}>Alternatif</Text>
            <Text style={styles.cellRight}>Nilai S</Text>
            <Text style={styles.cellRight}>Nilai V</Text>
          </View>
          {result.wp.rankings.map((r) => (
            <View style={styles.tr} key={r.alternativeId}>
              <Text style={styles.cellNarrow}>{r.rank}</Text>
              <Text style={styles.cell}>
                {r.code} - {r.name}
              </Text>
              <Text style={styles.cellRight}>{formatDecimal(r.s)}</Text>
              <Text style={styles.cellRight}>{formatDecimal(r.v)}</Text>
            </View>
          ))}
        </View>

        {/* Rekomendasi akhir */}
        <View style={styles.best}>
          <Text style={styles.bold}>
            Rekomendasi Strategi Terbaik:{" "}
            {result.bestAlternative
              ? `${result.bestAlternative.code} - ${result.bestAlternative.name}`
              : "-"}
          </Text>
        </View>

        <Text style={styles.footer}>
          Diekspor pada {exportedAt}. Dokumen ini dihasilkan otomatis oleh sistem SPK Koperasi.
          Jaga kerahasiaan dokumen ini karena dapat memuat nama nasabah.
        </Text>
      </Page>
    </Document>
  );
}
