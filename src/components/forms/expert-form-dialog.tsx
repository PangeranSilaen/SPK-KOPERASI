"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { upsertExpertAction } from "@/server/actions/entities";
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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(expert);

  // Field controlled agar tidak memicu warning Base UI saat data di-refresh.
  const [name, setName] = useState(expert?.name ?? "");
  const [position, setPosition] = useState(expert?.position ?? "");
  const [experience, setExperience] = useState(expert?.experience ?? "");
  const [notes, setNotes] = useState(expert?.notes ?? "");
  const [isEnabled, setIsEnabled] = useState(expert?.isEnabled ?? true);

  function handleOpenChange(next: boolean) {
    if (next) {
      // Reset nilai dari prop saat dialog dibuka.
      setName(expert?.name ?? "");
      setPosition(expert?.position ?? "");
      setExperience(expert?.experience ?? "");
      setNotes(expert?.notes ?? "");
      setIsEnabled(expert?.isEnabled ?? true);
      setError(null);
    }
    setOpen(next);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await upsertExpertAction({ ok: false }, formData);
      if (res.ok) {
        setError(null);
        setOpen(false);
        toast.success("Expert berhasil disimpan.");
      } else {
        setError(res.error ?? "Gagal menyimpan expert.");
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
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="modelId" value={modelId} />
          {expert ? <input type="hidden" name="id" value={expert.id} /> : null}
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Expert</Label>
            <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Jabatan (opsional)</Label>
            <Input
              id="position"
              name="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="experience">Lama Pengalaman (opsional)</Label>
            <Input
              id="experience"
              name="experience"
              placeholder="contoh: 12 tahun"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isEnabled"
              name="isEnabled"
              checked={isEnabled}
              onCheckedChange={(v) => setIsEnabled(v === true)}
            />
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
