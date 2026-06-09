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
import { CodedEntityFormDialog } from "@/components/forms/coded-entity-form-dialog";
import { DeleteButton } from "@/components/forms/delete-button";
import {
  upsertAlternativeAction,
  deleteAlternativeAction,
} from "@/server/actions/entities";
import { ReadOnlyNotice, SubPageHeader } from "@/components/model-subpage";

export const dynamic = "force-dynamic";

export default async function AlternatifPage({
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

  const items = await prisma.alternative.findMany({
    where: { modelId },
    orderBy: [{ order: "asc" }, { code: "asc" }],
  });

  const editable = model.status === "DRAFT";

  return (
    <div className="space-y-6">
      <SubPageHeader
        modelId={modelId}
        modelName={model.name}
        title="Alternatif Strategi"
        description="Pilihan tindakan penanganan kredit bermasalah."
        action={
          editable ? (
            <CodedEntityFormDialog
              modelId={modelId}
              action={upsertAlternativeAction}
              entityLabel="Alternatif"
              codePlaceholder="A1"
            />
          ) : undefined
        }
      />

      {!editable ? <ReadOnlyNotice status={model.status} /> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Alternatif</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada alternatif strategi.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Kode</TableHead>
                  <TableHead>Nama Alternatif</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-center">Urutan</TableHead>
                  <TableHead>Status</TableHead>
                  {editable ? <TableHead className="text-right">Aksi</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono font-medium">{a.code}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {a.description ?? "-"}
                    </TableCell>
                    <TableCell className="text-center font-mono">{a.order}</TableCell>
                    <TableCell>
                      {a.isActive ? (
                        <Badge variant="secondary" className="border border-border">Aktif</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Nonaktif</Badge>
                      )}
                    </TableCell>
                    {editable ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <CodedEntityFormDialog
                            modelId={modelId}
                            action={upsertAlternativeAction}
                            entityLabel="Alternatif"
                            codePlaceholder="A1"
                            entity={{
                              id: a.id,
                              code: a.code,
                              name: a.name,
                              description: a.description,
                              order: a.order,
                              isActive: a.isActive,
                            }}
                          />
                          <DeleteButton
                            action={deleteAlternativeAction}
                            modelId={modelId}
                            id={a.id}
                            label="alternatif"
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
    </div>
  );
}
