import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SubPageHeader } from "@/components/model-subpage";
import { StrategyForm, type ExistingScore } from "@/components/calculation/strategy-form";

export const dynamic = "force-dynamic";

export default async function NilaiStrategiPage({
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

  const [criteria, alternatives, conditions, experts, scores] = await Promise.all([
    prisma.criterion.findMany({
      where: { modelId, isActive: true },
      orderBy: [{ order: "asc" }, { code: "asc" }],
      select: { id: true, code: true, name: true },
    }),
    prisma.alternative.findMany({
      where: { modelId, isActive: true },
      orderBy: [{ order: "asc" }, { code: "asc" }],
      select: { id: true, code: true, name: true },
    }),
    prisma.condition.findMany({
      where: { modelId, isActive: true },
      orderBy: [{ order: "asc" }, { code: "asc" }],
      select: { id: true, code: true, name: true },
    }),
    prisma.expert.findMany({
      where: { modelId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, isEnabled: true },
    }),
    prisma.strategyScore.findMany({
      where: { modelId },
      select: {
        expertId: true,
        conditionId: true,
        alternativeId: true,
        criterionId: true,
        value: true,
      },
    }),
  ]);

  const editable = model.status === "DRAFT";

  return (
    <div className="space-y-6">
      <SubPageHeader
        modelId={modelId}
        modelName={model.name}
        title="Nilai Strategi"
        description="Nilai kecocokan alternatif terhadap kriteria per kondisi (skala 1-5)."
      />

      <StrategyForm
        modelId={modelId}
        criteria={criteria}
        alternatives={alternatives}
        conditions={conditions}
        experts={experts}
        existing={scores as ExistingScore[]}
        editable={editable}
      />

      <Link
        href={`/model-spk/${modelId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Kembali ke detail model
      </Link>
    </div>
  );
}
