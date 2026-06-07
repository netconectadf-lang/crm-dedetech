"use client";

import { useActionState, useEffect, useState } from "react";
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
  logo_url: string | null;
  preco_combustivel_litro: number | null;
  custo_hora_padrao: number | null;
  nfse_inscricao_municipal: string | null;
  nfse_codigo_municipio: string | null;
  nfse_item_lista_servico: string | null;
  nfse_aliquota_iss: number | null;
  nfse_iss_retido: boolean | null;
  email_remetente_nome: string | null;
  email_responder_para: string | null;
};

export function ConfigForm({ tenant }: { tenant: Tenant }) {
  const [state, formAction, pending] = useActionState<ConfigState, FormData>(
    updateTenant,
    null,
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(tenant.logo_url);

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
      <div className="grid gap-2">
        <Label htmlFor="logo">Logo da empresa</Label>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Logo da empresa" className="h-full w-full object-contain p-1" />
            ) : (
              <span className="text-[10px] text-muted-foreground">sem logo</span>
            )}
          </div>
          <Input
            id="logo"
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="cursor-pointer file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setLogoPreview(URL.createObjectURL(file));
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Aparece no certificado, laudos e propostas. PNG com fundo transparente, até 2 MB.
        </p>
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

      <div className="mt-2 border-t pt-4">
        <p className="text-sm font-medium">Comunicação (e-mail)</p>
        <p className="text-xs text-muted-foreground">
          Nome que aparece como remetente e e-mail para onde as respostas dos clientes vão.
          Os envios saem do domínio do sistema com a sua marca.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email_remetente_nome">Nome do remetente</Label>
        <Input
          id="email_remetente_nome"
          name="email_remetente_nome"
          placeholder="ex.: A7 Dedetizadora"
          defaultValue={tenant.email_remetente_nome ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email_responder_para">E-mail de resposta</Label>
        <Input
          id="email_responder_para"
          name="email_responder_para"
          type="email"
          placeholder="contato@suaempresa.com.br"
          defaultValue={tenant.email_responder_para ?? ""}
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
