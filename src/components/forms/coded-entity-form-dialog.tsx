"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
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
import type { ActionResult } from "@/server/actions/entities";

const initial: ActionResult = { ok: false };

export type CodedEntityData = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  order: number;
  isActive: boolean;
};

/**
 * Dialog generik untuk entitas berkode (alternatif & kondisi).
 */
export function CodedEntityFormDialog({
  modelId,
  entity,
  action,
  entityLabel,
  codePlaceholder,
}: {
  modelId: string;
  entity?: CodedEntityData;
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  entityLabel: string;
  codePlaceholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initial);
  const isEdit = Boolean(entity);

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
              Tambah {entityLabel}
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${entityLabel}` : `Tambah ${entityLabel}`}
          </DialogTitle>
          <DialogDescription>Kode wajib unik dalam satu Model SPK.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="modelId" value={modelId} />
          {entity ? <input type="hidden" name="id" value={entity.id} /> : null}
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="code">Kode</Label>
              <Input
                id="code"
                name="code"
                placeholder={codePlaceholder}
                defaultValue={entity?.code ?? ""}
                required
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Nama {entityLabel}</Label>
              <Input id="name" name="name" defaultValue={entity?.name ?? ""} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (opsional)</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={entity?.description ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order">Urutan</Label>
            <Input
              id="order"
              name="order"
              type="number"
              min={0}
              defaultValue={entity?.order ?? 0}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="isActive" name="isActive" defaultChecked={entity?.isActive ?? true} />
            <Label htmlFor="isActive" className="font-normal">
              {entityLabel} aktif
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
