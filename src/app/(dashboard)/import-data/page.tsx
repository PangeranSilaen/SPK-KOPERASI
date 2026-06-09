import { ImportClient } from "@/components/import-client";

export const dynamic = "force-dynamic";

export default function ImportDataPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Import Data XLSX</h1>
        <p className="text-sm text-muted-foreground">
          Unggah file XLSX untuk membuat Model SPK baru dari data pakar.
        </p>
      </div>
      <ImportClient />
    </div>
  );
}
