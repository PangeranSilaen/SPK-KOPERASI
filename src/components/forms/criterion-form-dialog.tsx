"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { upsertCriterionAction, type ActionResult } from "@/server/actions/entities";
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

const initial: ActionResult = { ok: false };

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
  const [state, formAction, pending] = useActionState(upsertCriterionAction, initial);
  const isEdit = Boolean(criterion);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

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
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="modelId" value={modelId} />
          {criterion ? <input type="hidden" name="id" value={criterion.id} /> : null}
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
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
