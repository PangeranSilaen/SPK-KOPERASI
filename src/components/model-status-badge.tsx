import { Badge } from "@/components/ui/badge";
import type { ModelStatus } from "@prisma/client";

const LABELS: Record<ModelStatus, string> = {
  DRAFT: "Draf",
  ACTIVE: "Aktif",
  ARCHIVED: "Arsip",
};

export function ModelStatusBadge({ status }: { status: ModelStatus }) {
  if (status === "ACTIVE") {
    return <Badge className="bg-primary text-primary-foreground">{LABELS.ACTIVE}</Badge>;
  }
  if (status === "DRAFT") {
    return (
      <Badge variant="secondary" className="border border-border">
        {LABELS.DRAFT}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      {LABELS.ARCHIVED}
    </Badge>
  );
}
