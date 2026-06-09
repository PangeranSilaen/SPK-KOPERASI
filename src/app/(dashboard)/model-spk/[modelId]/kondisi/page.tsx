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
  upsertConditionAction,
  deleteConditionAction,
} from "@/server/actions/entities";
import { ReadOnlyNotice, SubPageHeader } from "@/components/model-subpage";

export const dynamic = "force-dynamic";

export default async function KondisiPage({
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

  const items = await prisma.condition.findMany({
    where: { modelId },
    orderBy: [{ order: "asc" }, { code: "asc" }],
  });

  const editable = model.status === "DRAFT";

  return (
    <div className="space-y-6">
      <SubPageHeader
        modelId={modelId}
        modelName={model.name}
        title="Kondisi Nasabah"
        description="Kategori situasi nasabah sebagai dasar rekomendasi (bukan data pribadi)."
        action={
          editable ? (
            <CodedEntityFormDialog
              modelId={modelId}
              action={upsertConditionAction}
              entityLabel="Kondisi"
              codePlaceholder="K1"
            />
          ) : undefined
        }
      />

      {!editable ? <ReadOnlyNotice status={model.status} /> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Kondisi</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada kondisi nasabah.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Kode</TableHead>
                  <TableHead>Nama Kondisi</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-center">Urutan</TableHead>
                  <TableHead>Status</TableHead>
                  {editable ? <TableHead className="text-right">Aksi</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-mono font-medium">{k.code}</TableCell>
                    <TableCell>{k.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {k.description ?? "-"}
                    </TableCell>
                    <TableCell className="text-center font-mono">{k.order}</TableCell>
                    <TableCell>
                      {k.isActive ? (
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
                            action={upsertConditionAction}
                            entityLabel="Kondisi"
                            codePlaceholder="K1"
                            entity={{
                              id: k.id,
                              code: k.code,
                              name: k.name,
                              description: k.description,
                              order: k.order,
                              isActive: k.isActive,
                            }}
                          />
                          <DeleteButton
                            action={deleteConditionAction}
                            modelId={modelId}
                            id={k.id}
                            label="kondisi"
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
