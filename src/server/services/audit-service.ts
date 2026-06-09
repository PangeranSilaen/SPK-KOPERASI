import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Catat sebuah event lifecycle pada audit log.
 *
 * Catatan: model AKTIF bersifat immutable. Yang diaudit adalah event lifecycle
 * (buat, edit Draf, simpan AHP/WP, duplikat, publish, arsip, restore, hapus) —
 * bukan perubahan langsung pada model yang sudah dipublish.
 *
 * Audit log tidak boleh menggagalkan operasi utama. Bila pencatatan gagal,
 * error ditelan agar aksi inti tetap berjalan.
 */
export async function logAudit(params: {
  action: string;
  entity: string;
  summary: string;
  modelId?: string | null;
  userId?: string | null;
  userName?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        summary: params.summary,
        modelId: params.modelId ?? null,
        userId: params.userId ?? null,
        userName: params.userName ?? null,
      },
    });
  } catch {
    // Jangan biarkan kegagalan audit membatalkan aksi inti.
  }
}

export type AuditLogEntry = {
  id: string;
  action: string;
  entity: string;
  summary: string;
  userName: string | null;
  createdAt: Date;
};

/**
 * Ambil log audit untuk sebuah model, terbaru lebih dulu.
 */
export async function getAuditLogs(
  modelId: string,
  limit = 50,
): Promise<AuditLogEntry[]> {
  const logs = await prisma.auditLog.findMany({
    where: { modelId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entity: true,
      summary: true,
      userName: true,
      createdAt: true,
    },
  });
  return logs;
}
