"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { saveAhpComparisonsAction } from "@/server/actions/ahp";
import {
  aggregatePairwiseByGeometricMean,
  buildPairwiseMatrix,
  calculateAhp,
  type AhpCriterion,
} from "@/lib/calculations/ahp";
import { formatDecimal } from "@/lib/format";

type Criterion = { id: string; code: string; name: string };
type Expert = { id: string; name: string; isEnabled: boolean };
type Preference = "LEFT" | "RIGHT" | "EQUAL";

type PairState = {
  leftId: string;
  rightId: string;
  preference: Preference;
  scale: number;
};

export type ExistingComparison = {
  expertId: string;
  leftCriterionId: string;
  rightCriterionId: string;
  preference: Preference;
  scale: number;
};

function buildPairs(criteria: Criterion[]): Array<{ left: Criterion; right: Criterion }> {
  const pairs: Array<{ left: Criterion; right: Criterion }> = [];
  for (let i = 0; i < criteria.length; i++) {
    for (let j = i + 1; j < criteria.length; j++) {
      pairs.push({ left: criteria[i], right: criteria[j] });
    }
  }
  return pairs;
}

export function AhpForm({
  modelId,
  criteria,
  experts,
  existing,
  editable,
}: {
  modelId: string;
  criteria: Criterion[];
  experts: Expert[];
  existing: ExistingComparison[];
  editable: boolean;
}) {
  const pairs = useMemo(() => buildPairs(criteria), [criteria]);
  const [expertId, setExpertId] = useState<string>(experts[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  // State pairwise per expert, di-init dari data existing.
  const initState = useMemo(() => {
    const map = new Map<string, PairState[]>();
    for (const e of experts) {
      const list = pairs.map((p) => {
        const ex = existing.find(
          (x) =>
            x.expertId === e.id &&
            x.leftCriterionId === p.left.id &&
            x.rightCriterionId === p.right.id,
        );
        return {
          leftId: p.left.id,
          rightId: p.right.id,
          preference: ex?.preference ?? ("EQUAL" as Preference),
          scale: ex?.scale ?? 1,
        };
      });
      map.set(e.id, list);
    }
    return map;
  }, [experts, pairs, existing]);

  const [stateByExpert, setStateByExpert] = useState<Map<string, PairState[]>>(initState);

  // Tandai pasangan mana yang sudah pernah disimpan (untuk progress).
  const savedKeys = useMemo(() => {
    const set = new Set<string>();
    for (const x of existing) {
      set.add(`${x.expertId}__${x.leftCriterionId}__${x.rightCriterionId}`);
    }
    return set;
  }, [existing]);

  const currentPairs = stateByExpert.get(expertId) ?? [];

  const savedCount = pairs.filter((p) =>
    savedKeys.has(`${expertId}__${p.left.id}__${p.right.id}`),
  ).length;

  function updatePair(index: number, patch: Partial<PairState>) {
    setStateByExpert((prev) => {
      const next = new Map(prev);
      const list = [...(next.get(expertId) ?? [])];
      list[index] = { ...list[index], ...patch };
      next.set(expertId, list);
      return next;
    });
  }

  // Hitung AHP live dari state saat ini.
  const liveResult = useMemo(() => {
    if (criteria.length < 2) return null;
    const ahpCriteria: AhpCriterion[] = criteria.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
    }));
    const comparisons = currentPairs.map((p) => ({
      leftCriterionId: p.leftId,
      rightCriterionId: p.rightId,
      ratioValue:
        p.preference === "EQUAL" ? 1 : p.preference === "RIGHT" ? 1 / p.scale : p.scale,
    }));
    const matrix = buildPairwiseMatrix(ahpCriteria, comparisons);
    return calculateAhp(ahpCriteria, matrix);
  }, [criteria, currentPairs]);

  // Hitung CR gabungan semua expert aktif (untuk informasi).
  const combinedResult = useMemo(() => {
    if (criteria.length < 2) return null;
    const ahpCriteria: AhpCriterion[] = criteria.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
    }));
    const enabledExperts = experts.filter((e) => e.isEnabled);
    const expertInputs = enabledExperts.map((e) =>
      (stateByExpert.get(e.id) ?? []).map((p) => ({
        leftCriterionId: p.leftId,
        rightCriterionId: p.rightId,
        ratioValue:
          p.preference === "EQUAL" ? 1 : p.preference === "RIGHT" ? 1 / p.scale : p.scale,
      })),
    );
    if (expertInputs.length === 0) return null;
    const aggregated = aggregatePairwiseByGeometricMean(expertInputs);
    const matrix = buildPairwiseMatrix(ahpCriteria, aggregated);
    return calculateAhp(ahpCriteria, matrix);
  }, [criteria, experts, stateByExpert]);

  function handleSave() {
    const comparisons = currentPairs.map((p) => ({
      leftCriterionId: p.leftId,
      rightCriterionId: p.rightId,
      preference: p.preference,
      scale: p.preference === "EQUAL" ? 1 : p.scale,
    }));
    startTransition(async () => {
      const res = await saveAhpComparisonsAction({ modelId, expertId, comparisons });
      if (res.ok) {
        toast.success("Penilaian AHP berhasil disimpan.");
      } else {
        toast.error(res.error ?? "Gagal menyimpan penilaian AHP.");
      }
    });
  }

  if (criteria.length < 2) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Minimal harus ada 2 kriteria aktif untuk melakukan perbandingan AHP.
        </CardContent>
      </Card>
    );
  }

  if (experts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Belum ada expert. Tambahkan expert terlebih dahulu.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Perbandingan Berpasangan</CardTitle>
            <div className="w-48">
              <select
                value={expertId}
                onChange={(e) => setExpertId(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {experts.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                    {e.isEnabled ? "" : " (nonaktif)"}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tersimpan</span>
                <span className="font-medium">
                  {savedCount}/{pairs.length} pasangan
                </span>
              </div>
              <Progress value={pairs.length === 0 ? 0 : (savedCount / pairs.length) * 100} />
            </div>

            <div className="space-y-3">
              {currentPairs.map((p, idx) => {
                const pair = pairs[idx];
                return (
                  <div key={`${p.leftId}_${p.rightId}`} className="rounded-lg border border-border p-3">
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="font-medium">
                        <span className="font-mono text-primary">{pair.left.code}</span>{" "}
                        {pair.left.name}
                      </span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="text-right font-medium">
                        {pair.right.name}{" "}
                        <span className="font-mono text-primary">{pair.right.code}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex gap-1">
                        {(
                          [
                            { v: "LEFT", label: `${pair.left.code} lebih penting` },
                            { v: "EQUAL", label: "Sama" },
                            { v: "RIGHT", label: `${pair.right.code} lebih penting` },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.v}
                            type="button"
                            disabled={!editable}
                            onClick={() =>
                              updatePair(idx, {
                                preference: opt.v,
                                scale: opt.v === "EQUAL" ? 1 : p.scale === 1 ? 3 : p.scale,
                              })
                            }
                            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                              p.preference === opt.v
                                ? "border-primary bg-primary/15 text-foreground"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <select
                        value={p.scale}
                        disabled={!editable || p.preference === "EQUAL"}
                        onChange={(e) => updatePair(idx, { scale: Number(e.target.value) })}
                        className="ml-auto flex h-8 rounded-md border border-input bg-transparent px-2 text-xs outline-none disabled:opacity-50"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <option key={n} value={n}>
                            Intensitas {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {editable ? (
              <Button onClick={handleSave} disabled={pending} className="w-full">
                {pending ? "Menyimpan..." : "Simpan Penilaian AHP"}
              </Button>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Model tidak dapat diedit. Duplikat menjadi Draf untuk mengubah penilaian.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hasil Expert Terpilih</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {liveResult ? (
              <>
                <ConsistencyBadge cr={liveResult.cr} isConsistent={liveResult.isConsistent} />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Metric label="λ maks" value={formatDecimal(liveResult.lambdaMax)} />
                  <Metric label="CI" value={formatDecimal(liveResult.ci)} />
                  <Metric label="CR" value={formatDecimal(liveResult.cr)} />
                  <Metric label="Kriteria" value={String(criteria.length)} />
                </div>
                <WeightTable weights={liveResult.weights} />
              </>
            ) : null}
          </CardContent>
        </Card>

        {combinedResult ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hasil Gabungan (Expert Aktif)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ConsistencyBadge
                cr={combinedResult.cr}
                isConsistent={combinedResult.isConsistent}
              />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Metric label="λ maks" value={formatDecimal(combinedResult.lambdaMax)} />
                <Metric label="CR" value={formatDecimal(combinedResult.cr)} />
              </div>
              <WeightTable weights={combinedResult.weights} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function ConsistencyBadge({ cr, isConsistent }: { cr: number; isConsistent: boolean }) {
  return isConsistent ? (
    <Badge className="bg-[var(--color-trading-up)] text-black">
      Konsisten (CR = {formatDecimal(cr)})
    </Badge>
  ) : (
    <Badge className="bg-[var(--color-trading-down)] text-white">
      Tidak konsisten (CR = {formatDecimal(cr)} &gt; 0.1)
    </Badge>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono font-medium">{value}</div>
    </div>
  );
}

function WeightTable({
  weights,
}: {
  weights: Array<{ criterionId: string; code: string; name: string; weight: number }>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kriteria</TableHead>
          <TableHead className="text-right">Bobot</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {weights.map((w) => (
          <TableRow key={w.criterionId}>
            <TableCell>
              <span className="font-mono text-primary">{w.code}</span> {w.name}
            </TableCell>
            <TableCell className="text-right font-mono">{formatDecimal(w.weight)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
