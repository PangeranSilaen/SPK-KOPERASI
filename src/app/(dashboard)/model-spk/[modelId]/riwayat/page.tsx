import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SubPageHeader } from "@/components/model-subpage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateId } from "@/lib/format-date";
import { formatDecimal } from "@/lib/format";
import { History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RiwayatPage({
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

  const runs = await prisma.calculationRun.findMany({
    where: { modelId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      customerName: true,
      conditionLabel: true,
      bestAlternative: true,
      consistencyRatio: true,
      isConsistent: true,
      selectedExpertIds: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <SubPageHeader
        modelId={modelId}
        modelName={model.name}
        title="Riwayat Kalkulasi"
        description="Daftar rekomendasi yang pernah dihitung, beserta nama nasabah terkait."
      />

      <Card>
        <CardContent className="p-0">
          {runs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <History className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Belum ada riwayat kalkulasi</p>
              <p className="text-sm text-muted-foreground">
                Hitung rekomendasi di halaman Simulasi & Hasil untuk mengisi riwayat ini.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Nama Nasabah</TableHead>
                  <TableHead>Kondisi</TableHead>
                  <TableHead>Rekomendasi Terbaik</TableHead>
                  <TableHead className="text-center">Expert</TableHead>
                  <TableHead className="text-right">CR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r) => {
                  const expertCount = Array.isArray(r.selectedExpertIds)
                    ? r.selectedExpertIds.length
                    : 0;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateId(r.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {r.customerName ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{r.conditionLabel ?? "—"}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {r.bestAlternative ?? "—"}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {expertCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.consistencyRatio === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : r.isConsistent ? (
                          <Badge className="border-transparent bg-success-soft text-success font-mono">
                            {formatDecimal(r.consistencyRatio)}
                          </Badge>
                        ) : (
                          <Badge className="border-transparent bg-warning-soft text-warning font-mono">
                            {formatDecimal(r.consistencyRatio)}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
