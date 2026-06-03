"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { updateTenant, type ConfigState } from "@/app/(app)/configuracoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Tenant = {
  razao_social: string;
  nome_fantasia: string | null;
  registro_vigilancia_sanitaria: string | null;
  cor_primaria: string | null;
};

export function ConfigForm({ tenant }: { tenant: Tenant }) {
  const [state, formAction, pending] = useActionState<ConfigState, FormData>(
    updateTenant,
    null,
  );

  useEffect(() => {
    if (state?.message) toast.success(state.message);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="grid max-w-lg gap-4">
      <div className="grid gap-2">
        <Label htmlFor="razao_social">Razão social</Label>
        <Input
          id="razao_social"
          name="razao_social"
          defaultValue={tenant.razao_social}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="nome_fantasia">Nome fantasia</Label>
        <Input
          id="nome_fantasia"
          name="nome_fantasia"
          defaultValue={tenant.nome_fantasia ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="registro_vigilancia_sanitaria">
          Registro na Vigilância Sanitária
        </Label>
        <Input
          id="registro_vigilancia_sanitaria"
          name="registro_vigilancia_sanitaria"
          defaultValue={tenant.registro_vigilancia_sanitaria ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cor_primaria">Cor da marca</Label>
        <Input
          id="cor_primaria"
          name="cor_primaria"
          type="text"
          placeholder="#0F766E"
          defaultValue={tenant.cor_primaria ?? "#0F766E"}
        />
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          Salvar
        </Button>
      </div>
    </form>
  );
}
