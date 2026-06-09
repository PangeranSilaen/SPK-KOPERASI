"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Trophy, FileDown } from "lucide-react";
import {
  calculateRecommendationAction,
  type CalculationActionResult,
} from "@/server/actions/calculation";
import type { RecommendationResult } from "@/server/services/calculation-service";
import { RankingTable } from "@/components/calculation/ranking-table";
import { AhpDetail } from "@/components/calculation/ahp-detail";
import { WpDetail } from "@/components/calculation/wp-detail";
import { formatDecimal } from "@/lib/format";

type Expert = {
  id: string;
  name: string;
  isEnabled: boolean;
  complete: boolean;
};
type Condition = { id: string; code: string; name: string };

export function SimulationPanel({
  modelId,
  conditions,
  experts,
}: {
  modelId: string;
  conditions: Condition[];
  experts: Expert[];
}) {
  const [conditionId, setConditionId] = useState(conditions[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(experts.filter((e) => e.isEnabled && e.complete).map((e) => e.id)),
  );
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<{ message: string; problems?: string[] } | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleExpert(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCalculate() {
    setError(null);
    setResult(null);
    const expertIds = [...selected];
    if (!conditionId) {
      toast.error("Pilih kondisi nasabah terlebih dahulu.");
      return;
    }
    if (expertIds.length === 0) {
      toast.error("Pilih minimal satu expert.");
      return;
    }
    startTransition(async () => {
      const res: CalculationActionResult = await calculateRecommendationAction({
        modelId,
        conditionId,
        expertIds,
      });
      if (res.ok) {
        setResult(res.result);
        toast.success("Perhitungan rekomendasi selesai.");
      } else {
        setError({ message: res.error, problems: res.problems });
      }
    });
  }

  function handleExportPdf() {
    if (!result) return;
    const params = new URLSearchParams({
      modelId,
      conditionId,
      expertIds: [...selected].join(","),
    });
    window.open(`/api/export/pdf?${params.toString()}`, "_blank");
  }

  if (conditions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Belum ada kondisi nasabah. Tambahkan kondisi terlebih dahulu.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parameter Simulasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Kondisi Nasabah</label>
            <select
              value={conditionId}
              onChange={(e) => setConditionId(e.target.value)}
              className="flex h-9 w-full max-w-md rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {conditions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Expert yang dilibatkan</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {experts.map((e) => {
                const disabled = !e.isEnabled || !e.complete;
                return (
                  <label
                    key={e.id}
                    className={`flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm ${
                      disabled ? "opacity-60" : "cursor-pointer hover:bg-muted"
                    }`}
                  >
                    <Checkbox
                      checked={selected.has(e.id)}
                      disabled={disabled}
                      onCheckedChange={() => toggleExpert(e.id)}
                    />
                    <span className="flex-1">{e.name}</span>
                    {!e.isEnabled ? (
                      <Badge variant="outline" className="text-xs">
                        nonaktif
                      </Badge>
                    ) : !e.complete ? (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        belum lengkap
                      </Badge>
                    ) : (
                      <Badge className="bg-[var(--color-trading-up)] text-black text-xs">
                        lengkap
                      </Badge>
                    )}
                  </label>
                );
              })}
              {experts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada expert.</p>
              ) : null}
            </div>
          </div>

          <Button onClick={handleCalculate} disabled={pending}>
            <Calculator className="h-4 w-4" />
            {pending ? "Menghitung..." : "Hitung Rekomendasi"}
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>{error.message}</AlertTitle>
          {error.problems && error.problems.length > 0 ? (
            <AlertDescription>
              <ul className="ml-4 list-disc space-y-1">
                {error.problems.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </AlertDescription>
          ) : null}
        </Alert>
      ) : null}

      {result ? (
        <>
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Rekomendasi untuk {result.condition.code} - {result.condition.name}
                  </div>
                  <div className="font-semibold">
                    {result.bestAlternative
                      ? `${result.bestAlternative.code} - ${result.bestAlternative.name}`
                      : "-"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {result.ahp.isConsistent ? (
                  <Badge className="bg-[var(--color-trading-up)] text-black">
                    CR {formatDecimal(result.ahp.cr)} (konsisten)
                  </Badge>
                ) : (
                  <Badge className="bg-[var(--color-trading-down)] text-white">
                    CR {formatDecimal(result.ahp.cr)} (tidak konsisten)
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={handleExportPdf}>
                  <FileDown className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hasil Perankingan</CardTitle>
            </CardHeader>
            <CardContent>
              <RankingTable rankings={result.wp.rankings} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detail Perhitungan</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ahp">
                <TabsList>
                  <TabsTrigger value="ahp">Detail AHP</TabsTrigger>
                  <TabsTrigger value="wp">Detail WP</TabsTrigger>
                </TabsList>
                <TabsContent value="ahp" className="pt-4">
                  <AhpDetail ahp={result.ahp} criteria={result.criteria} />
                </TabsContent>
                <TabsContent value="wp" className="pt-4">
                  <WpDetail wp={result.wp} criteria={result.criteria} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
