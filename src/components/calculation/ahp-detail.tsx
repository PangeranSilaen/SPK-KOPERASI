import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDecimal } from "@/lib/format";
import type { AhpResult } from "@/lib/calculations/ahp";

export function AhpDetail({
  ahp,
  criteria,
}: {
  ahp: AhpResult;
  criteria: Array<{ id: string; code: string }>;
}) {
  const codes = criteria.map((c) => c.code);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Metric label="λ maks" value={formatDecimal(ahp.lambdaMax)} />
        <Metric label="CI" value={formatDecimal(ahp.ci)} />
        <Metric label="CR" value={formatDecimal(ahp.cr)} />
        <div className="flex items-center">
          {ahp.isConsistent ? (
            <Badge className="bg-[var(--color-trading-up)] text-black">Konsisten</Badge>
          ) : (
            <Badge className="bg-[var(--color-trading-down)] text-white">Tidak konsisten</Badge>
          )}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium">Matriks Perbandingan Berpasangan</h4>
        <MatrixTable codes={codes} matrix={ahp.matrix} footerLabel="Total Kolom" footer={ahp.columnSums} />
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium">Matriks Normalisasi & Bobot</h4>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                {codes.map((c) => (
                  <TableHead key={c} className="text-center font-mono">
                    {c}
                  </TableHead>
                ))}
                <TableHead className="text-right">Bobot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ahp.normalizedMatrix.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-primary">{codes[i]}</TableCell>
                  {row.map((val, j) => (
                    <TableCell key={j} className="text-center font-mono text-muted-foreground">
                      {formatDecimal(val)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-mono font-medium">
                    {formatDecimal(ahp.weights[i]?.weight ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium">Bobot Kriteria</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kriteria</TableHead>
              <TableHead className="text-right">Bobot</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ahp.weights.map((w) => (
              <TableRow key={w.criterionId}>
                <TableCell>
                  <span className="font-mono text-primary">{w.code}</span> {w.name}
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatDecimal(w.weight)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MatrixTable({
  codes,
  matrix,
  footer,
  footerLabel,
}: {
  codes: string[];
  matrix: number[][];
  footer?: number[];
  footerLabel?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            {codes.map((c) => (
              <TableHead key={c} className="text-center font-mono">
                {c}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {matrix.map((row, i) => (
            <TableRow key={i}>
              <TableCell className="font-mono text-primary">{codes[i]}</TableCell>
              {row.map((val, j) => (
                <TableCell key={j} className="text-center font-mono text-muted-foreground">
                  {formatDecimal(val)}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {footer ? (
            <TableRow>
              <TableCell className="text-xs font-medium">{footerLabel}</TableCell>
              {footer.map((val, j) => (
                <TableCell key={j} className="text-center font-mono font-medium">
                  {formatDecimal(val)}
                </TableCell>
              ))}
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono font-medium">{value}</div>
    </div>
  );
}
