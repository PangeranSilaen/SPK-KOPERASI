import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuditLogs } from "@/server/services/audit-service";
import { SubPageHeader } from "@/components/model-subpage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateId } from "@/lib/format-date";
import { ScrollText } from "lucide-react";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  CREATE: "Buat",
  DUPLICATE: "Duplikat",
  PUBLISH: "Publish",
  ARCHIVE: "Arsip",
  RESTORE: "Pulihkan",
  DELETE: "Hapus",
  UPSERT: "Ubah",
};

export default async function AuditPage({
  params,
}: {
  params: Promise<{ modelId: string }>;
}) {
  const { modelId } = await params;
  const model = await prisma.decisionModel.findUnique({
    where: { id: modelId },
    select: { id: true, name: true },
  });
  if (!model) notFound();

  const logs = await getAuditLogs(modelId);

  return (
    <div className="space-y-6">
      <SubPageHeader
        modelId={modelId}
        modelName={model.name}
        title="Log Aktivitas"
        description="Jejak perubahan lifecycle model: buat, edit Draf, publish, arsip, dan pulihkan."
      />

      <Card>
        <CardContent className={logs.length === 0 ? "" : "p-0"}>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <ScrollText className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Belum ada aktivitas tercatat</p>
              <p className="text-sm text-muted-foreground">
                Aktivitas perubahan pada model ini akan muncul di sini.
              </p>
            </div>
          ) : (
            <ol className="divide-y divide-border">
              {logs.map((log) => (
                <li key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    {ACTION_LABEL[log.action] ?? log.action}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{log.summary}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {log.userName ? `${log.userName} · ` : ""}
                      {formatDateId(log.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
