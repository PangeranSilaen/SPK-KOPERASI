"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { deleteModelAction } from "@/server/actions/model";

/**
 * Aksi hapus model pada baris daftar.
 * Model AKTIF tidak dapat dihapus langsung (harus diarsipkan dulu) — tombol dinonaktifkan.
 */
export function ModelRowDelete({
  modelId,
  modelName,
  status,
}: {
  modelId: string;
  modelName: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
}) {
  if (status === "ACTIVE") {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        title="Model aktif tidak dapat dihapus. Arsipkan terlebih dahulu."
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <ConfirmDialog
      modelId={modelId}
      trigger={
        <Button variant="ghost" size="sm" aria-label={`Hapus model ${modelName}`}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      }
      title={`Hapus model "${modelName}"?`}
      description="Tindakan ini tidak dapat dibatalkan. Seluruh kriteria, alternatif, kondisi, expert, penilaian, dan riwayat kalkulasi pada model ini akan ikut terhapus."
      confirmLabel="Hapus"
      variant="destructive"
      successMessage="Model berhasil dihapus."
      action={deleteModelAction}
    />
  );
}
