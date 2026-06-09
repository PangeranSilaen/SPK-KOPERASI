import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getModelCompleteness } from "@/server/services/completeness-service";
import { SubPageHeader } from "@/components/model-subpage";
import { SimulationPanel } from "@/components/calculation/simulation-panel";

export const dynamic = "force-dynamic";

export default async function SimulasiPage({
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

  const [conditions, completeness] = await Promise.all([
    prisma.condition.findMany({
      where: { modelId, isActive: true },
      orderBy: [{ order: "asc" }, { code: "asc" }],
      select: { id: true, code: true, name: true },
    }),
    getModelCompleteness(modelId),
  ]);

  const experts = completeness.experts.map((e) => ({
    id: e.expertId,
    name: e.expertName,
    isEnabled: e.isEnabled,
    complete: e.complete,
  }));

  return (
    <div className="space-y-6">
      <SubPageHeader
        modelId={modelId}
        modelName={model.name}
        title="Simulasi & Hasil"
        description="Pilih kondisi nasabah dan expert, lalu hitung rekomendasi strategi."
      />

      <SimulationPanel modelId={modelId} conditions={conditions} experts={experts} />
    </div>
  );
}
