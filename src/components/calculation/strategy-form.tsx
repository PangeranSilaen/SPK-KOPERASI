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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const expertItems = useMemo(
    () =>
      Object.fromEntries(
        experts.map((e) => [e.id, `${e.name}${e.isEnabled ? "" : " (nonaktif)"}`]),
      ),
    [experts],
  );
  const conditionItems = useMemo(
    () => Object.fromEntries(conditions.map((c) => [c.id, `${c.code} - ${c.name}`])),
    [conditions],
  );
  const valueItems = useMemo(
    () => Object.fromEntries([1, 2, 3, 4, 5].map((n) => [String(n), String(n)])),
    [],
  );

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
          <div className="space-y-1.5">
            <Label htmlFor="strat-expert">Expert</Label>
            <Select items={expertItems} value={expertId} onValueChange={(v) => setExpertId(v ?? "")}>
              <SelectTrigger id="strat-expert" className="w-full">
                <SelectValue placeholder="Pilih expert" />
              </SelectTrigger>
              <SelectContent>
                {experts.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                    {e.isEnabled ? "" : " (nonaktif)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="strat-condition">Kondisi Nasabah</Label>
            <Select items={conditionItems} value={conditionId} onValueChange={(v) => setConditionId(v ?? "")}>
              <SelectTrigger id="strat-condition" className="w-full">
                <SelectValue placeholder="Pilih kondisi" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                        <Select
                          items={valueItems}
                          value={v ? String(v) : ""}
                          disabled={!editable}
                          onValueChange={(val) => setValue(a.id, c.id, Number(val))}
                        >
                          <SelectTrigger
                            size="sm"
                            className={`mx-auto w-14 justify-center ${
                              v === undefined ? "border-warning/60" : ""
                            }`}
                          >
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <SelectItem key={n} value={String(n)}>
                                {n}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
