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
import { ExpertFormDialog } from "@/components/forms/expert-form-dialog";
import { DeleteButton } from "@/components/forms/delete-button";
import { deleteExpertAction } from "@/server/actions/entities";
import { ReadOnlyNotice, SubPageHeader } from "@/components/model-subpage";

export const dynamic = "force-dynamic";

export default async function ExpertPage({
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

  const experts = await prisma.expert.findMany({
    where: { modelId },
    orderBy: { name: "asc" },
  });

  const editable = model.status === "DRAFT";

  return (
    <div className="space-y-6">
      <SubPageHeader
        modelId={modelId}
        modelName={model.name}
        title="Expert"
        description="Kelola pakar yang memberikan penilaian AHP dan WP."
        action={editable ? <ExpertFormDialog modelId={modelId} /> : undefined}
      />

      {!editable ? <ReadOnlyNotice status={model.status} /> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Expert</CardTitle>
        </CardHeader>
        <CardContent>
          {experts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada expert.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Pengalaman</TableHead>
                  <TableHead>Status</TableHead>
                  {editable ? <TableHead className="text-right">Aksi</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {experts.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.position ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.experience ?? "-"}
                    </TableCell>
                    <TableCell>
                      {e.isEnabled ? (
                        <Badge variant="secondary" className="border border-border">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                    {editable ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <ExpertFormDialog
                            modelId={modelId}
                            expert={{
                              id: e.id,
                              name: e.name,
                              position: e.position,
                              experience: e.experience,
                              notes: e.notes,
                              isEnabled: e.isEnabled,
                            }}
                          />
                          <DeleteButton
                            action={deleteExpertAction}
                            modelId={modelId}
                            id={e.id}
                            label="expert"
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
