import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SubPageHeader } from "@/components/model-subpage";
import { AhpForm, type ExistingComparison } from "@/components/calculation/ahp-form";

export const dynamic = "force-dynamic";

export default async function AhpPage({
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

  const [criteria, experts, comparisons] = await Promise.all([
    prisma.criterion.findMany({
      where: { modelId, isActive: true },
      orderBy: [{ order: "asc" }, { code: "asc" }],
      select: { id: true, code: true, name: true },
    }),
    prisma.expert.findMany({
      where: { modelId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, isEnabled: true },
    }),
    prisma.ahpComparison.findMany({
      where: { modelId },
      select: {
        expertId: true,
        leftCriterionId: true,
        rightCriterionId: true,
        preference: true,
        scale: true,
      },
    }),
  ]);

  const editable = model.status === "DRAFT";

  return (
    <div className="space-y-6">
      <SubPageHeader
        modelId={modelId}
        modelName={model.name}
        title="Input AHP"
        description="Perbandingan berpasangan antar kriteria memakai skala Saaty 1-9."
      />

      <AhpForm
        modelId={modelId}
        criteria={criteria}
        experts={experts}
        existing={comparisons as ExistingComparison[]}
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
