"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { confirmImportAction, type ConfirmImportResult } from "@/server/actions/import";

type PreviewData = {
  fileName: string;
  summary: {
    expertCount: number;
    criteriaCount: number;
    alternativeCount: number;
    conditionCount: number;
    pairwiseCount: number;
    scoreCount: number;
  };
  errors: string[];
  warnings: string[];
};

const initial: ConfirmImportResult = { ok: false };

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      <Upload className="h-4 w-4" />
      {pending ? "Mengimport..." : "Buat Model SPK dari Import"}
    </Button>
  );
}

export function ImportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmState, confirmAction] = useActionState(confirmImportAction, initial);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(null);
    setPreviewError(null);
    if (!f) return;

    setLoadingPreview(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/import/preview", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error ?? "Gagal membaca file.");
      } else {
        setPreview(data);
      }
    } catch {
      setPreviewError("Gagal mengunggah file untuk preview.");
    } finally {
      setLoadingPreview(false);
    }
  }

  const canImport = Boolean(preview && preview.errors.length === 0 && file);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unggah File XLSX</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Import akan selalu membuat <strong>Model SPK baru</strong> berstatus Draf dan
              tidak menimpa model aktif. File harus berisi sheet pairwise AHP dan sheet nilai
              strategi.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="file">File XLSX</Label>
            <Input
              ref={fileInputRef}
              id="file"
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
            />
          </div>

          {loadingPreview ? (
            <p className="text-sm text-muted-foreground">Membaca file...</p>
          ) : null}

          {previewError ? (
            <Alert variant="destructive">
              <AlertDescription>{previewError}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {preview ? (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{preview.fileName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Expert" value={preview.summary.expertCount} />
              <Stat label="Kriteria" value={preview.summary.criteriaCount} />
              <Stat label="Alternatif" value={preview.summary.alternativeCount} />
              <Stat label="Kondisi" value={preview.summary.conditionCount} />
              <Stat label="Pairwise AHP" value={preview.summary.pairwiseCount} />
              <Stat label="Nilai Strategi" value={preview.summary.scoreCount} />
            </div>

            {preview.errors.length === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Data valid dan siap diimport.</AlertTitle>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>
                  File belum dapat diimport karena terdapat data yang belum lengkap:
                </AlertTitle>
                <AlertDescription>
                  <ul className="ml-4 list-disc space-y-1">
                    {preview.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {preview.warnings.length > 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Peringatan</AlertTitle>
                <AlertDescription>
                  <ul className="ml-4 list-disc space-y-1">
                    {preview.warnings.slice(0, 10).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {canImport ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Konfirmasi Import</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={(formData) => {
                if (file) formData.set("file", file);
                confirmAction(formData);
              }}
              className="space-y-4"
            >
              {confirmState.error ? (
                <Alert variant="destructive">
                  <AlertTitle>{confirmState.error}</AlertTitle>
                  {confirmState.problems && confirmState.problems.length > 0 ? (
                    <AlertDescription>
                      <ul className="ml-4 list-disc space-y-1">
                        {confirmState.problems.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  ) : null}
                </Alert>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="modelName">Nama Model SPK Baru</Label>
                <Input
                  id="modelName"
                  name="modelName"
                  placeholder="Contoh: Model SPK Hasil Import"
                  required
                />
              </div>
              <SubmitButton disabled={!canImport} />
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-xl font-semibold">{value}</div>
    </div>
  );
}
