import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getModelCompleteness } from "@/server/services/completeness-service";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FolderKanban,
  Upload,
  ListChecks,
  Users,
  Layers,
  Target,
  ListTodo,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const activeModel = await prisma.decisionModel.findFirst({
    where: { status: "ACTIVE" },
  });

  const [draftCount, archivedCount] = await Promise.all([
    prisma.decisionModel.count({ where: { status: "DRAFT" } }),
    prisma.decisionModel.count({ where: { status: "ARCHIVED" } }),
  ]);

  if (!activeModel) {
    return (
      <div className="space-y-6">
        <PageTitle />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <FolderKanban className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Belum ada Model SPK aktif</p>
              <p className="text-sm text-muted-foreground">
                Silakan buat Model SPK atau import data dari file XLSX terlebih dahulu.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/model-spk" className={buttonVariants()}>
                Buat Model SPK
              </Link>
              <Link href="/import-data" className={buttonVariants({ variant: "outline" })}>
                Import XLSX
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completeness = await getModelCompleteness(activeModel.id);
  const ahpExperts = completeness.experts.filter((e) => e.isEnabled);
  const completeExperts = ahpExperts.filter((e) => e.complete).length;
  const completionPct =
    ahpExperts.length === 0 ? 0 : Math.round((completeExperts / ahpExperts.length) * 100);

  return (
    <div className="space-y-6">
      <PageTitle />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {activeModel.name}
              <Badge className="bg-primary text-primary-foreground">Aktif</Badge>
            </CardTitle>
            {activeModel.description ? (
              <p className="text-sm text-muted-foreground">{activeModel.description}</p>
            ) : null}
          </div>
          <Link
            href={`/model-spk/${activeModel.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Lihat Detail
          </Link>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={ListChecks} label="Kriteria" value={completeness.criteriaCount} />
          <StatCard icon={Target} label="Alternatif" value={completeness.alternativeCount} />
          <StatCard icon={Layers} label="Kondisi" value={completeness.conditionCount} />
          <StatCard icon={Users} label="Expert" value={completeness.expertCount} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Kelengkapan Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expert lengkap (aktif)</span>
                <span className="font-medium">
                  {completeExperts}/{ahpExperts.length}
                </span>
              </div>
              <Progress value={completionPct} />
            </div>
            <div className="space-y-2">
              {completeness.experts.map((e) => (
                <div
                  key={e.expertId}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className={e.isEnabled ? "" : "text-muted-foreground"}>
                    {e.expertName}
                    {!e.isEnabled ? " (nonaktif)" : ""}
                  </span>
                  {e.complete ? (
                    <Badge className="border-transparent bg-success-soft text-success">Lengkap</Badge>
                  ) : (
                    <Badge variant="outline" className="text-warning">
                      Belum lengkap
                    </Badge>
                  )}
                </div>
              ))}
              {completeness.experts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada expert.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ringkasan Model SPK</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model Draf</span>
              <span className="font-medium">{draftCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model Arsip</span>
              <span className="font-medium">{archivedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pairwise AHP wajib / expert</span>
              <span className="font-medium">{completeness.requiredAhp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nilai strategi wajib / expert</span>
              <span className="font-medium">{completeness.requiredWp}</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href={`/model-spk/${activeModel.id}/simulasi`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <ListTodo className="h-4 w-4" />
                Lihat Hasil
              </Link>
              <Link
                href="/import-data"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Upload className="h-4 w-4" />
                Import Data
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PageTitle() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Ringkasan Model SPK aktif dan status kelengkapan data.
      </p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold">{value}</div>
    </div>
  );
}
