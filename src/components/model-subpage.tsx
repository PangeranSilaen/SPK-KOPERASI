import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ModelStatus } from "@prisma/client";

export function SubPageHeader({
  modelId,
  modelName,
  title,
  description,
  action,
}: {
  modelId: string;
  modelName: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/model-spk" className="hover:text-foreground">
          Model SPK
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/model-spk/${modelId}`} className="hover:text-foreground">
          {modelName}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{title}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
}

export function ReadOnlyNotice({ status }: { status: ModelStatus }) {
  const label = status === "ACTIVE" ? "Aktif" : "Arsip";
  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="py-4 text-sm">
        Model ini berstatus <strong>{label}</strong> dan bersifat hanya-baca. Duplikat model
        menjadi Draf untuk melakukan perubahan.
      </CardContent>
    </Card>
  );
}
