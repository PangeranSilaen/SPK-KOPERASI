"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { upsertExpertAction, type ActionResult } from "@/server/actions/entities";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initial: ActionResult = { ok: false };

export type ExpertData = {
  id: string;
  name: string;
  position: string | null;
  experience: string | null;
  notes: string | null;
  isEnabled: boolean;
};

export function ExpertFormDialog({
  modelId,
  expert,
}: {
  modelId: string;
  expert?: ExpertData;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(upsertExpertAction, initial);
  const isEdit = Boolean(expert);

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
              Tambah Expert
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Expert" : "Tambah Expert"}</DialogTitle>
          <DialogDescription>Pakar yang memberikan penilaian AHP dan WP.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="modelId" value={modelId} />
          {expert ? <input type="hidden" name="id" value={expert.id} /> : null}
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Expert</Label>
            <Input id="name" name="name" defaultValue={expert?.name ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Jabatan (opsional)</Label>
            <Input id="position" name="position" defaultValue={expert?.position ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="experience">Lama Pengalaman (opsional)</Label>
            <Input
              id="experience"
              name="experience"
              placeholder="contoh: 12 tahun"
              defaultValue={expert?.experience ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={expert?.notes ?? ""} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="isEnabled" name="isEnabled" defaultChecked={expert?.isEnabled ?? true} />
            <Label htmlFor="isEnabled" className="font-normal">
              Aktif digunakan dalam perhitungan
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
