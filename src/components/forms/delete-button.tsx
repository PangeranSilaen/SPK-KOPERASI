"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

/**
 * Tombol hapus dengan konfirmasi. Memanggil server action (form) yang diberikan.
 */
export function DeleteButton({
  action,
  modelId,
  id,
  label,
}: {
  action: (formData: FormData) => void | Promise<void>;
  modelId: string;
  id: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus {label}?</DialogTitle>
          <DialogDescription>
            Tindakan ini tidak dapat dibatalkan. Data penilaian terkait juga akan terhapus.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
          <form action={action}>
            <input type="hidden" name="modelId" value={modelId} />
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="destructive">
              Hapus
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
