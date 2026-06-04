"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

import type { SaveState } from "@/lib/crud-helpers";
import { finalizarOS } from "@/app/(app)/os/actions";
import { Button } from "@/components/ui/button";

export function FinalizeButton({ osId }: { osId: string }) {
  const action = finalizarOS.bind(null, osId);
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    action,
    null,
  );

  useEffect(() => {
    if (state?.message) toast.success(state.message);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <Button type="submit" size="lg" disabled={pending} className="bg-primary hover:bg-primary/90">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        Finalizar OS (baixa estoque)
      </Button>
    </form>
  );
}
