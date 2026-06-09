"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { salvarConfigNfse } from "@/app/(app)/integracoes/nfse/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SaveState } from "@/lib/crud-helpers";

type Config = {
  cnpj: string | null;
  inscricaoMunicipal: string | null;
  codigoMunicipio: string | null;
  codTribNacional: string | null;
  codTribMunicipal: string | null;
  aliquotaIss: number | null;
  issRetido: boolean;
  opSimplesNacional: number;
  regimeEspecial: number;
  ambiente: number;
  serie: string;
};

const selectCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function NfseConfigForm({ config }: { config: Config }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(salvarConfigNfse, null);

  useEffect(() => {
    if (state?.message) toast.success(state.message);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="cnpj">CNPJ da empresa</Label>
        <Input id="cnpj" name="cnpj" defaultValue={config.cnpj ?? ""} placeholder="00.000.000/0000-00" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="inscricaoMunicipal">Inscrição municipal</Label>
        <Input id="inscricaoMunicipal" name="inscricaoMunicipal" defaultValue={config.inscricaoMunicipal ?? ""} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="codigoMunicipio">Código do município (IBGE, 7 díg.)</Label>
        <Input id="codigoMunicipio" name="codigoMunicipio" defaultValue={config.codigoMunicipio ?? ""} placeholder="5300108" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="codTribNacional">Cód. tributação nacional (6 díg.)</Label>
        <Input id="codTribNacional" name="codTribNacional" defaultValue={config.codTribNacional ?? ""} placeholder="071301" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="codTribMunicipal">Cód. tributação municipal (só DF/ISSnet)</Label>
        <Input id="codTribMunicipal" name="codTribMunicipal" defaultValue={config.codTribMunicipal ?? ""} placeholder="710" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="aliquotaIss">Alíquota do ISS (%)</Label>
        <Input id="aliquotaIss" name="aliquotaIss" type="number" step="0.01" min="0" max="100" defaultValue={config.aliquotaIss ?? ""} placeholder="5" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="serie">Série da DPS</Label>
        <Input id="serie" name="serie" defaultValue={config.serie ?? "1"} placeholder="1" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="opSimplesNacional">Simples Nacional</Label>
        <select id="opSimplesNacional" name="opSimplesNacional" defaultValue={String(config.opSimplesNacional)} className={selectCls}>
          <option value="1">Não optante</option>
          <option value="2">MEI</option>
          <option value="3">ME / EPP (optante)</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="regimeEspecial">Regime especial de tributação</Label>
        <select id="regimeEspecial" name="regimeEspecial" defaultValue={String(config.regimeEspecial)} className={selectCls}>
          <option value="0">Nenhum</option>
          <option value="1">Ato cooperado</option>
          <option value="2">Estimativa</option>
          <option value="3">Microempresa municipal</option>
          <option value="4">Notário / registrador</option>
          <option value="5">Profissional autônomo</option>
          <option value="6">Sociedade de profissionais</option>
          <option value="9">Outros</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ambiente">Ambiente</Label>
        <select id="ambiente" name="ambiente" defaultValue={String(config.ambiente)} className={selectCls}>
          <option value="2">Produção Restrita (testes)</option>
          <option value="1">Produção (validade jurídica)</option>
        </select>
      </div>
      <div className="flex items-center gap-2 self-end pb-1">
        <input
          id="issRetido"
          name="issRetido"
          type="checkbox"
          defaultChecked={config.issRetido}
          className="size-4 rounded border-input"
        />
        <Label htmlFor="issRetido" className="font-normal">ISS retido pelo tomador</Label>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar dados fiscais"}
        </Button>
      </div>
    </form>
  );
}
