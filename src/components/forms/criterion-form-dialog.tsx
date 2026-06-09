"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { upsertCriterionAction } from "@/server/actions/entities";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type CriterionData = {
  id: string;
  code: string;
  name: string;
  type: "BENEFIT" | "COST";
  order: number;
  isActive: boolean;
};

export function CriterionFormDialog({
  modelId,
  criterion,
}: {
  modelId: string;
  criterion?: CriterionData;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(criterion);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await upsertCriterionAction({ ok: false }, formData);
      if (res.ok) {
        setError(null);
        setOpen(false);
        toast.success("Kriteria berhasil disimpan.");
      } else {
        setError(res.error ?? "Gagal menyimpan kriteria.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4" />
            </Button>
          ) : (
            <Button>
              <Plus className="h-4 w-4" />
              Tambah Kriteria
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Kriteria" : "Tambah Kriteria"}</DialogTitle>
          <DialogDescription>
            Benefit: makin tinggi makin baik. Cost: makin rendah makin baik.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="modelId" value={modelId} />
          {criterion ? <input type="hidden" name="id" value={criterion.id} /> : null}
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="code">Kode</Label>
              <Input id="code" name="code" placeholder="C1" defaultValue={criterion?.code ?? ""} required />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Nama Kriteria</Label>
              <Input id="name" name="name" defaultValue={criterion?.name ?? ""} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Jenis Kriteria</Label>
            <select
              id="type"
              name="type"
              defaultValue={criterion?.type ?? "BENEFIT"}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="BENEFIT">Benefit</option>
              <option value="COST">Cost</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="order">Urutan</Label>
            <Input
              id="order"
              name="order"
              type="number"
              min={0}
              defaultValue={criterion?.order ?? 0}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="isActive" name="isActive" defaultChecked={criterion?.isActive ?? true} />
            <Label htmlFor="isActive" className="font-normal">
              Kriteria aktif
            </Label>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
