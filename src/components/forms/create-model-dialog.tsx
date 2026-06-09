"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createModelAction, type ActionResult } from "@/server/actions/model";
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

const initial: ActionResult = { ok: false };

export function CreateModelDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createModelAction, initial);

  // Tutup dialog jika berhasil (redirect terjadi, tapi jaga-jaga).
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

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
        <form action={formAction} className="space-y-4">
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
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
