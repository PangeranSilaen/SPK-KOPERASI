"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createModelAction } from "@/server/actions/model";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CreateModelDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      // createModelAction melakukan redirect saat sukses; error dikembalikan sebagai state.
      const res = await createModelAction({ ok: false }, formData);
      if (res && !res.ok) {
        setError(res.error ?? "Gagal membuat model.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="h-4 w-4" />
            Buat Model SPK
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Model SPK</DialogTitle>
          <DialogDescription>
            Model baru akan dibuat dengan status Draf dan dapat diedit.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Model</Label>
            <Input id="name" name="name" placeholder="Contoh: Model SPK 2026" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (opsional)</Label>
            <Textarea id="description" name="description" rows={3} />
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
