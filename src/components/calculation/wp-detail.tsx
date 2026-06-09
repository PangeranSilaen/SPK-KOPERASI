import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDecimal } from "@/lib/format";
import type { WpResult } from "@/lib/calculations/wp";

export function WpDetail({
  wp,
  criteria,
}: {
  wp: WpResult;
  criteria: Array<{ id: string; code: string; type: "BENEFIT" | "COST" }>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-sm font-medium">Pangkat Kriteria (Benefit positif, Cost negatif)</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kriteria</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead className="text-right">Pangkat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wp.weightedCriteria.map((w) => {
              const crit = criteria.find((c) => c.id === w.criterionId);
              return (
                <TableRow key={w.criterionId}>
                  <TableCell>
                    <span className="font-mono text-primary">{w.code}</span> {w.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {crit?.type === "COST" ? "Cost" : "Benefit"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatDecimal(w.exponent)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium">Nilai Vektor S dan V</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alternatif</TableHead>
              <TableHead className="text-right">S</TableHead>
              <TableHead className="text-right">V</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wp.vValues.map((v) => (
              <TableRow key={v.alternativeId}>
                <TableCell>
                  <span className="font-mono text-primary">{v.code}</span> {v.name}
                </TableCell>
                <TableCell className="text-right font-mono">{formatDecimal(v.s)}</TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatDecimal(v.v)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="text-xs font-medium">Total S</TableCell>
              <TableCell className="text-right font-mono font-medium">
                {formatDecimal(wp.totalS)}
              </TableCell>
              <TableCell className="text-right font-mono font-medium">
                {formatDecimal(1)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
