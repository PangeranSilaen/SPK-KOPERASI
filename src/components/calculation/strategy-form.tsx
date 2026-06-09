"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { saveStrategyScoresAction } from "@/server/actions/strategy";

type Entity = { id: string; code: string; name: string };
type Expert = { id: string; name: string; isEnabled: boolean };

export type ExistingScore = {
  expertId: string;
  conditionId: string;
  alternativeId: string;
  criterionId: string;
  value: number;
};

export function StrategyForm({
  modelId,
  criteria,
  alternatives,
  conditions,
  experts,
  existing,
  editable,
}: {
  modelId: string;
  criteria: Entity[];
  alternatives: Entity[];
  conditions: Entity[];
  experts: Expert[];
  existing: ExistingScore[];
  editable: boolean;
}) {
  const [expertId, setExpertId] = useState(experts[0]?.id ?? "");
  const [conditionId, setConditionId] = useState(conditions[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  // Map nilai: key = expertId|conditionId|altId|critId -> value
  const initValues = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of existing) {
      map.set(`${s.expertId}|${s.conditionId}|${s.alternativeId}|${s.criterionId}`, s.value);
    }
    return map;
  }, [existing]);

  const [values, setValues] = useState<Map<string, number>>(initValues);

  function key(altId: string, critId: string) {
    return `${expertId}|${conditionId}|${altId}|${critId}`;
  }

  function setValue(altId: string, critId: string, value: number) {
    setValues((prev) => {
      const next = new Map(prev);
      next.set(key(altId, critId), value);
      return next;
    });
  }

  // Progress kelengkapan untuk expert + kondisi terpilih.
  const totalCells = alternatives.length * criteria.length;
  const filledCells = useMemo(() => {
    let count = 0;
    for (const a of alternatives) {
      for (const c of criteria) {
        const v = values.get(key(a.id, c.id));
        if (v !== undefined && v >= 1 && v <= 5) count++;
      }
    }
    return count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, alternatives, criteria, expertId, conditionId]);

  function handleSave() {
    const scores: Array<{
      conditionId: string;
      alternativeId: string;
      criterionId: string;
      value: number;
    }> = [];
    for (const a of alternatives) {
      for (const c of criteria) {
        const v = values.get(key(a.id, c.id));
        if (v !== undefined && v >= 1 && v <= 5) {
          scores.push({ conditionId, alternativeId: a.id, criterionId: c.id, value: v });
        }
      }
    }
    if (scores.length === 0) {
      toast.error("Belum ada nilai untuk disimpan.");
      return;
    }
    startTransition(async () => {
      const res = await saveStrategyScoresAction({ modelId, expertId, conditionId, scores });
      if (res.ok) {
        toast.success("Nilai strategi berhasil disimpan.");
      } else {
        toast.error(res.error ?? "Gagal menyimpan nilai strategi.");
      }
    });
  }

  if (criteria.length === 0 || alternatives.length === 0 || conditions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Lengkapi kriteria, alternatif, dan kondisi terlebih dahulu sebelum mengisi nilai
          strategi.
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
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle className="text-base">Input Nilai Strategi (skala 1-5)</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Expert</label>
            <select
              value={expertId}
              onChange={(e) => setExpertId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {experts.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                  {e.isEnabled ? "" : " (nonaktif)"}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Kondisi Nasabah</label>
            <select
              value={conditionId}
              onChange={(e) => setConditionId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {conditions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Terisi (kombinasi ini)</span>
            <span className="font-medium">
              {filledCells}/{totalCells}
            </span>
          </div>
          <Progress value={totalCells === 0 ? 0 : (filledCells / totalCells) * 100} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card">Alternatif</TableHead>
                {criteria.map((c) => (
                  <TableHead key={c.id} className="text-center">
                    <span className="font-mono text-primary">{c.code}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {alternatives.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="sticky left-0 bg-card font-medium">
                    <span className="font-mono text-primary">{a.code}</span> {a.name}
                  </TableCell>
                  {criteria.map((c) => {
                    const v = values.get(key(a.id, c.id));
                    return (
                      <TableCell key={c.id} className="text-center">
                        <select
                          value={v ?? ""}
                          disabled={!editable}
                          onChange={(e) =>
                            setValue(a.id, c.id, Number(e.target.value))
                          }
                          className={`h-8 w-16 rounded-md border bg-transparent px-1 text-center text-sm outline-none disabled:opacity-50 ${
                            v === undefined
                              ? "border-[var(--color-trading-down)]/50"
                              : "border-input"
                          }`}
                        >
                          <option value="">-</option>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {editable ? (
          <Button onClick={handleSave} disabled={pending} className="w-full">
            {pending ? "Menyimpan..." : "Simpan Nilai Strategi"}
          </Button>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Model tidak dapat diedit. Duplikat menjadi Draf untuk mengubah nilai.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
