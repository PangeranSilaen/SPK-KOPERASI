"use client";

import { useActionState, useState } from "react";
import { Send, Copy, Archive } from "lucide-react";
import {
  publishModelAction,
  duplicateModelAction,
  archiveModelAction,
  type ActionResult,
} from "@/server/actions/model";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const initial: ActionResult = { ok: false };

export function ModelActions({
  modelId,
  status,
}: {
  modelId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
}) {
  const [state, publishAction, publishing] = useActionState(publishModelAction, initial);
  const [confirmArchive, setConfirmArchive] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === "DRAFT" ? (
          <form action={publishAction}>
            <input type="hidden" name="modelId" value={modelId} />
            <Button type="submit" disabled={publishing}>
              <Send className="h-4 w-4" />
              {publishing ? "Memvalidasi..." : "Publish menjadi Aktif"}
            </Button>
          </form>
        ) : null}

        <form action={duplicateModelAction}>
          <input type="hidden" name="modelId" value={modelId} />
          <Button type="submit" variant="outline">
            <Copy className="h-4 w-4" />
            {status === "ACTIVE" ? "Duplikat menjadi Draf" : "Duplikat"}
          </Button>
        </form>

        {status !== "ARCHIVED" && status !== "ACTIVE" ? (
          confirmArchive ? (
            <form action={archiveModelAction}>
              <input type="hidden" name="modelId" value={modelId} />
              <Button type="submit" variant="destructive">
                <Archive className="h-4 w-4" />
                Konfirmasi Arsipkan
              </Button>
            </form>
          ) : (
            <Button variant="outline" onClick={() => setConfirmArchive(true)}>
              <Archive className="h-4 w-4" />
              Arsipkan
            </Button>
          )
        ) : null}
      </div>

      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>{state.error}</AlertTitle>
          {state.problems && state.problems.length > 0 ? (
            <AlertDescription>
              <ul className="ml-4 list-disc space-y-1">
                {state.problems.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </AlertDescription>
          ) : null}
        </Alert>
      ) : null}

      {state.ok ? (
        <Alert>
          <AlertTitle>Model berhasil dipublish menjadi Aktif.</AlertTitle>
        </Alert>
      ) : null}
    </div>
  );
}
