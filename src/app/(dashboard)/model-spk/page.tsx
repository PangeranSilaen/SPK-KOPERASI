import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ModelStatusBadge } from "@/components/model-status-badge";
import { CreateModelDialog } from "@/components/forms/create-model-dialog";
import { ModelRowDelete } from "@/components/forms/model-row-delete";
import { formatDateId } from "@/lib/format-date";

export const dynamic = "force-dynamic";

const STATUS_ORDER = { ACTIVE: 0, DRAFT: 1, ARCHIVED: 2 } as const;

export default async function ModelSpkListPage() {
  const models = await prisma.decisionModel.findMany({
    include: {
      _count: {
        select: { criteria: true, alternatives: true, conditions: true, experts: true },
      },
    },
  });

  const sorted = [...models].sort((a, b) => {
    const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (s !== 0) return s;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Model SPK</h1>
          <p className="text-sm text-muted-foreground">
            Kelola versi Model SPK: Draf, Aktif, dan Arsip.
          </p>
        </div>
        <CreateModelDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Model</CardTitle>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada Model SPK. Buat model baru atau import dari XLSX.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Kriteria</TableHead>
                  <TableHead className="text-center">Alternatif</TableHead>
                  <TableHead className="text-center">Kondisi</TableHead>
                  <TableHead className="text-center">Expert</TableHead>
                  <TableHead>Diperbarui</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>
                      <ModelStatusBadge status={m.status} />
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {m._count.criteria}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {m._count.alternatives}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {m._count.conditions}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {m._count.experts}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateId(m.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/model-spk/${m.id}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Lihat
                        </Link>
                        <ModelRowDelete
                          modelId={m.id}
                          modelName={m.name}
                          status={m.status}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
