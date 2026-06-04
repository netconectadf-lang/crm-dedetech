"use client";

import { useActionState, useEffect, useRef } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { importarPedidoUpload } from "@/app/(app)/compras/actions";
import type { SaveState } from "@/lib/crud-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UploadPedido() {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    importarPedidoUpload,
    null,
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <Input
        type="file"
        name="arquivo"
        accept="application/pdf,.pdf"
        required
        className="sm:max-w-xs"
      />
      <Button type="submit" disabled={pending}>
        <Upload className="size-4" />
        {pending ? "Lendo PDF…" : "Importar pedido"}
      </Button>
    </form>
  );
}
