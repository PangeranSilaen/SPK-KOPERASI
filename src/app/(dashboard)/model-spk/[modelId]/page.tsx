import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getModelCompleteness } from "@/server/services/completeness-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ModelStatusBadge } from "@/components/model-status-badge";
import { ModelActions } from "@/components/forms/model-actions";
import { formatDateId } from "@/lib/format-date";
import {
  Users,
  ListChecks,
  Target,
  Layers,
  GitCompare,
  Table2,
  Calculator,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

const SUBPAGES = [
  { slug: "expert", label: "Expert", icon: Users, desc: "Kelola pakar penilai" },
  { slug: "kriteria", label: "Kriteria", icon: ListChecks, desc: "Faktor penilaian benefit/cost" },
  { slug: "alternatif", label: "Alternatif Strategi", icon: Target, desc: "Pilihan tindakan" },
  { slug: "kondisi", label: "Kondisi Nasabah", icon: Layers, desc: "Kategori situasi" },
  { slug: "ahp", label: "Input AHP", icon: GitCompare, desc: "Perbandingan berpasangan" },
  { slug: "nilai-strategi", label: "Nilai Strategi", icon: Table2, desc: "Input nilai WP 1-5" },
  { slug: "simulasi", label: "Simulasi & Hasil", icon: Calculator, desc: "Hitung rekomendasi" },
];

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ modelId: string }>;
}) {
  const { modelId } = await params;
  const model = await prisma.decisionModel.findUnique({ where: { id: modelId } });
  if (!model) notFound();

  const completeness = await getModelCompleteness(modelId);
  const enabledExperts = completeness.experts.filter((e) => e.isEnabled);
  const completeExperts = enabledExperts.filter((e) => e.complete).length;
  const pct =
    enabledExperts.length === 0
      ? 0
      : Math.round((completeExperts / enabledExperts.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/model-spk" className="hover:text-foreground">
          Model SPK
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{model.name}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{model.name}</h1>
            <ModelStatusBadge status={model.status} />
          </div>
          {model.description ? (
            <p className="text-sm text-muted-foreground">{model.description}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Diperbarui {formatDateId(model.updatedAt)}
          </p>
        </div>
      </div>

      <ModelActions modelId={model.id} status={model.status} />

      {model.status === "ACTIVE" ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="py-4 text-sm">
            Model ini berstatus <strong>Aktif</strong> dan tidak dapat diedit langsung.
            Gunakan tombol <strong>Duplikat menjadi Draf</strong> untuk melakukan perubahan.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Kelola Data Model</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {SUBPAGES.map((p) => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.slug}
                  href={`/model-spk/${model.id}/${p.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.desc}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kelengkapan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Kriteria" value={completeness.criteriaCount} />
              <Stat label="Alternatif" value={completeness.alternativeCount} />
              <Stat label="Kondisi" value={completeness.conditionCount} />
              <Stat label="Expert" value={completeness.expertCount} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expert lengkap (aktif)</span>
                <span className="font-medium">
                  {completeExperts}/{enabledExperts.length}
                </span>
              </div>
              <Progress value={pct} />
            </div>
            <div className="space-y-2">
              {completeness.experts.map((e) => (
                <div
                  key={e.expertId}
                  className="rounded-md border border-border px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className={e.isEnabled ? "" : "text-muted-foreground"}>
                      {e.expertName}
                      {!e.isEnabled ? " (nonaktif)" : ""}
                    </span>
                    {e.complete ? (
                      <Badge className="bg-[var(--color-trading-up)] text-black">Lengkap</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Belum lengkap
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                    <span>AHP {e.ahp.done}/{e.ahp.required}</span>
                    <span>WP {e.wp.done}/{e.wp.required}</span>
                  </div>
                </div>
              ))}
              {completeness.experts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada expert.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-lg font-semibold">{value}</div>
    </div>
  );
}
