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
import type { Ranking } from "@/lib/calculations/ranking";

export function RankingTable({ rankings }: { rankings: Ranking[] }) {
  // Deteksi rank yang muncul lebih dari sekali (tie).
  const rankCount = new Map<number, number>();
  for (const r of rankings) {
    rankCount.set(r.rank, (rankCount.get(r.rank) ?? 0) + 1);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16 text-center">Ranking</TableHead>
          <TableHead>Alternatif Strategi</TableHead>
          <TableHead className="text-right">Nilai S</TableHead>
          <TableHead className="text-right">Nilai V</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rankings.map((r) => {
          const isTie = (rankCount.get(r.rank) ?? 0) > 1;
          return (
            <TableRow key={r.alternativeId}>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-sm font-semibold ${
                      r.rank === 1
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {r.rank}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-primary">{r.code}</span> {r.name}
                {isTie ? (
                  <Badge variant="outline" className="ml-2 text-xs text-muted-foreground">
                    seri
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell className="text-right font-mono">{formatDecimal(r.s)}</TableCell>
              <TableCell className="text-right font-mono font-medium">
                {formatDecimal(r.v)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
