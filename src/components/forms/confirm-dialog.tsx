"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmResult = { ok: boolean; error?: string; problems?: string[] };

/**
 * Dialog konfirmasi generik untuk aksi yang mengubah/menghapus data.
 * - Mencegah double-submit lewat `useTransition` (tombol konfirmasi disabled saat pending).
 * - Memberi toast sukses/gagal.
 * - `action` menerima FormData (server action) dan boleh mengembalikan ConfirmResult.
 *   Aksi yang melakukan redirect (mis. duplikat) cukup mengembalikan void.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Konfirmasi",
  variant = "default",
  modelId,
  successMessage,
  action,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  modelId: string;
  successMessage?: string;
  action: (formData: FormData) => Promise<ConfirmResult | void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("modelId", modelId);
      const res = (await action(fd)) as ConfirmResult | void;
      if (res && res.ok === false) {
        toast.error(res.error ?? "Aksi gagal dijalankan.");
        return;
      }
      if (successMessage) toast.success(successMessage);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger}
      </span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Batal
          </Button>
          <Button variant={variant} onClick={handleConfirm} disabled={pending}>
            {pending ? "Memproses..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
