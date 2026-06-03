"use client";

import { useActionState } from "react";
import { UserPlus, Loader2 } from "lucide-react";

import type { SaveState } from "@/lib/crud-helpers";
import { convidarPortal } from "@/app/(app)/clientes/actions";
import { Button } from "@/components/ui/button";

export function ConvidarPortal({ clientId }: { clientId: string }) {
  const action = convidarPortal.bind(null, clientId);
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    action,
    null,
  );

  return (
    <div className="space-y-2">
      <form action={formAction}>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          Convidar para o portal
        </Button>
      </form>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.message && (
        <p className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-800">
          {state.message}
        </p>
      )}
    </div>
  );
}
