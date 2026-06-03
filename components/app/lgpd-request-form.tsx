"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { createLgpdRequest, type LgpdState } from "@/app/(app)/lgpd/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIPOS = [
  { value: "access", label: "Acesso aos dados" },
  { value: "portability", label: "Portabilidade" },
  { value: "erasure", label: "Exclusão / anonimização" },
  { value: "rectification", label: "Retificação" },
];

export function LgpdRequestForm() {
  const [state, formAction, pending] = useActionState<LgpdState, FormData>(
    createLgpdRequest,
    null,
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message) {
      toast.success(state.message);
      ref.current?.reset();
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="grid gap-3 sm:grid-cols-2">
      <Select name="tipo" defaultValue="access">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIPOS.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        name="titular_email"
        type="email"
        placeholder="e-mail do titular"
        required
      />
      <Input
        name="detalhe"
        placeholder="Detalhe (opcional)"
        className="sm:col-span-2"
      />
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          Registrar solicitação
        </Button>
      </div>
    </form>
  );
}
