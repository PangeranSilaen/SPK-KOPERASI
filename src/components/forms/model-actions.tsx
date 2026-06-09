"use client";

import { Send, Copy, Archive, RotateCcw } from "lucide-react";
import {
  publishModelAction,
  duplicateModelAction,
  archiveModelAction,
  restoreModelAction,
} from "@/server/actions/model";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";

export function ModelActions({
  modelId,
  status,
}: {
  modelId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {status === "DRAFT" ? (
        <ConfirmDialog
          modelId={modelId}
          trigger={
            <Button>
              <Send className="h-4 w-4" />
              Publish menjadi Aktif
            </Button>
          }
          title="Publish model menjadi Aktif?"
          description="Model akan divalidasi lalu dijadikan model Aktif. Model Aktif sebelumnya otomatis menjadi Arsip. Model Aktif tidak dapat diedit langsung."
          confirmLabel="Publish"
          successMessage="Model berhasil dipublish menjadi Aktif."
          action={(fd) => publishModelAction({ ok: false }, fd)}
        />
      ) : null}

      <ConfirmDialog
        modelId={modelId}
        trigger={
          <Button variant="outline">
            <Copy className="h-4 w-4" />
            {status === "ACTIVE" ? "Duplikat menjadi Draf" : "Duplikat"}
          </Button>
        }
        title="Duplikat model ini?"
        description="Salinan baru berstatus Draf akan dibuat berikut seluruh entitas dan penilaiannya. Anda akan diarahkan ke salinan tersebut."
        confirmLabel="Duplikat"
        action={duplicateModelAction}
      />

      {status === "DRAFT" ? (
        <ConfirmDialog
          modelId={modelId}
          trigger={
            <Button variant="outline">
              <Archive className="h-4 w-4" />
              Arsipkan
            </Button>
          }
          title="Arsipkan model ini?"
          description="Model akan dipindahkan ke Arsip dan menjadi hanya-baca. Anda dapat mengembalikannya menjadi Draf kapan saja."
          confirmLabel="Arsipkan"
          variant="destructive"
          successMessage="Model berhasil diarsipkan."
          action={archiveModelAction}
        />
      ) : null}

      {status === "ARCHIVED" ? (
        <ConfirmDialog
          modelId={modelId}
          trigger={
            <Button variant="outline">
              <RotateCcw className="h-4 w-4" />
              Kembalikan dari Arsip
            </Button>
          }
          title="Kembalikan model dari Arsip?"
          description="Model akan dikembalikan menjadi Draf sehingga dapat diedit kembali."
          confirmLabel="Kembalikan"
          successMessage="Model dikembalikan menjadi Draf."
          action={restoreModelAction}
        />
      ) : null}
    </div>
  );
}
