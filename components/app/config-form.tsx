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
  preco_combustivel_litro: number | null;
  custo_hora_padrao: number | null;
  nfse_inscricao_municipal: string | null;
  nfse_codigo_municipio: string | null;
  nfse_item_lista_servico: string | null;
  nfse_aliquota_iss: number | null;
  nfse_iss_retido: boolean | null;
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

      <div className="mt-2 border-t pt-4">
        <p className="text-sm font-medium">Custos operacionais</p>
        <p className="text-xs text-muted-foreground">
          Usados para calcular o custo de cada ordem de serviço.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="preco_combustivel_litro">Preço do combustível (R$/litro)</Label>
        <Input
          id="preco_combustivel_litro"
          name="preco_combustivel_litro"
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="6.00"
          defaultValue={tenant.preco_combustivel_litro ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="custo_hora_padrao">Custo/hora padrão da equipe (R$)</Label>
        <Input
          id="custo_hora_padrao"
          name="custo_hora_padrao"
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="usado quando o salário não está cadastrado"
          defaultValue={tenant.custo_hora_padrao ?? ""}
        />
      </div>

      <div className="mt-2 border-t pt-4">
        <p className="text-sm font-medium">Dados fiscais (NFS-e)</p>
        <p className="text-xs text-muted-foreground">
          Preencha com seu contador para emitir nota fiscal de serviço.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="nfse_inscricao_municipal">Inscrição municipal</Label>
        <Input id="nfse_inscricao_municipal" name="nfse_inscricao_municipal" defaultValue={tenant.nfse_inscricao_municipal ?? ""} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="nfse_codigo_municipio">Código do município (IBGE)</Label>
        <Input id="nfse_codigo_municipio" name="nfse_codigo_municipio" inputMode="numeric" placeholder="ex.: 5300108 (Brasília)" defaultValue={tenant.nfse_codigo_municipio ?? ""} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="nfse_item_lista_servico">Item da lista de serviço (LC 116)</Label>
        <Input id="nfse_item_lista_servico" name="nfse_item_lista_servico" placeholder="dedetização ≈ 7.13" defaultValue={tenant.nfse_item_lista_servico ?? ""} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="nfse_aliquota_iss">Alíquota do ISS (%)</Label>
        <Input id="nfse_aliquota_iss" name="nfse_aliquota_iss" type="number" step="0.01" inputMode="decimal" placeholder="ex.: 5" defaultValue={tenant.nfse_aliquota_iss ?? ""} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="nfse_iss_retido" defaultChecked={!!tenant.nfse_iss_retido} className="size-4 accent-[var(--color-primary)]" />
        ISS retido pelo tomador
      </label>

      <div>
        <Button type="submit" disabled={pending}>
          Salvar
        </Button>
      </div>
    </form>
  );
}
