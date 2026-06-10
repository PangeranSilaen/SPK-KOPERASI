"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(entity);

  const [code, setCode] = useState(entity?.code ?? "");
  const [name, setName] = useState(entity?.name ?? "");
  const [description, setDescription] = useState(entity?.description ?? "");
  const [order, setOrder] = useState(String(entity?.order ?? 0));
  const [isActive, setIsActive] = useState(entity?.isActive ?? true);

  function handleOpenChange(next: boolean) {
    if (next) {
      setCode(entity?.code ?? "");
      setName(entity?.name ?? "");
      setDescription(entity?.description ?? "");
      setOrder(String(entity?.order ?? 0));
      setIsActive(entity?.isActive ?? true);
      setError(null);
    }
    setOpen(next);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await action({ ok: false }, formData);
      if (res.ok) {
        setError(null);
        setOpen(false);
        toast.success(`${entityLabel} berhasil disimpan.`);
      } else {
        setError(res.error ?? "Gagal menyimpan data.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="modelId" value={modelId} />
          {entity ? <input type="hidden" name="id" value={entity.id} /> : null}
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="code">Kode</Label>
              <Input
                id="code"
                name="code"
                placeholder={codePlaceholder}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Nama {entityLabel}</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (opsional)</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order">Urutan</Label>
            <Input
              id="order"
              name="order"
              type="number"
              min={0}
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isActive"
              name="isActive"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(v === true)}
            />
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
