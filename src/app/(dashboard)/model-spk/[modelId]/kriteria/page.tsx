import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CriterionFormDialog } from "@/components/forms/criterion-form-dialog";
import { DeleteButton } from "@/components/forms/delete-button";
import { deleteCriterionAction } from "@/server/actions/entities";
import { ReadOnlyNotice, SubPageHeader } from "@/components/model-subpage";
import { getRequiredAhpPairCount } from "@/lib/completeness";

export const dynamic = "force-dynamic";

export default async function KriteriaPage({
  params,
}: {
  params: Promise<{ modelId: string }>;
}) {
  const { modelId } = await params;
  const model = await prisma.decisionModel.findUnique({
    where: { id: modelId },
    select: { id: true, name: true, status: true },
  });
  if (!model) notFound();

  const criteria = await prisma.criterion.findMany({
    where: { modelId },
    orderBy: [{ order: "asc" }, { code: "asc" }],
  });
  const activeCount = criteria.filter((c) => c.isActive).length;
  const requiredPairs = getRequiredAhpPairCount(activeCount);

  const editable = model.status === "DRAFT";

  return (
    <div className="space-y-6">
      <SubPageHeader
        modelId={modelId}
        modelName={model.name}
        title="Kriteria"
        description="Faktor penilaian untuk mengevaluasi alternatif strategi."
        action={editable ? <CriterionFormDialog modelId={modelId} /> : undefined}
      />

      {!editable ? <ReadOnlyNotice status={model.status} /> : null}

      <Card className="border-border/60 bg-secondary/30">
        <CardContent className="py-3 text-sm text-muted-foreground">
          {activeCount} kriteria aktif memerlukan{" "}
          <span className="font-mono font-medium text-foreground">{requiredPairs}</span>{" "}
          perbandingan berpasangan AHP per expert{" "}
          <span className="text-xs">(rumus n(n-1)/2)</span>. Setiap perubahan kriteria
          mengharuskan AHP dan nilai strategi dilengkapi ulang.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Kriteria</CardTitle>
        </CardHeader>
        <CardContent>
          {criteria.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada kriteria.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Kode</TableHead>
                  <TableHead>Nama Kriteria</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead className="text-center">Urutan</TableHead>
                  <TableHead>Status</TableHead>
                  {editable ? <TableHead className="text-right">Aksi</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {criteria.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium">{c.code}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>
                      {c.type === "BENEFIT" ? (
                        <Badge className="bg-[var(--color-trading-up)] text-black">Benefit</Badge>
                      ) : (
                        <Badge className="bg-[var(--color-trading-down)] text-white">Cost</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono">{c.order}</TableCell>
                    <TableCell>
                      {c.isActive ? (
                        <Badge variant="secondary" className="border border-border">Aktif</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Nonaktif</Badge>
                      )}
                    </TableCell>
                    {editable ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <CriterionFormDialog
                            modelId={modelId}
                            criterion={{
                              id: c.id,
                              code: c.code,
                              name: c.name,
                              type: c.type,
                              order: c.order,
                              isActive: c.isActive,
                            }}
                          />
                          <DeleteButton
                            action={deleteCriterionAction}
                            modelId={modelId}
                            id={c.id}
                            label="kriteria"
                          />
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Link
        href={`/model-spk/${modelId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Kembali ke detail model
      </Link>
    </div>
  );
}
