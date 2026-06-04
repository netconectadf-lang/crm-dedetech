"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { FileBadge, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { salvarCertificadoNfse, removerCertificadoNfse } from "@/app/(app)/integracoes/nfse/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SaveState } from "@/lib/crud-helpers";

type Resumo = { titularDoc: string | null; validade: string | null; atualizadoEm: string } | null;

export function CertUpload({ resumo }: { resumo: Resumo }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(salvarCertificadoNfse, null);
  const [removendo, startRemover] = useTransition();

  useEffect(() => {
    if (state?.message) toast.success(state.message);
    if (state?.error) toast.error(state.error);
  }, [state]);

  const vencido = resumo?.validade ? new Date(resumo.validade) < new Date() : false;

  return (
    <div className="space-y-4">
      {resumo ? (
        <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
          <ShieldCheck className={`size-5 shrink-0 ${vencido ? "text-amber-400" : "text-emerald-400"}`} />
          <div className="flex-1 text-sm">
            <p className="font-medium">Certificado instalado</p>
            <p className="text-muted-foreground">
              {resumo.titularDoc ? `Titular: ${resumo.titularDoc}. ` : ""}
              {resumo.validade
                ? vencido
                  ? `VENCIDO em ${new Date(resumo.validade).toLocaleDateString("pt-BR")}.`
                  : `Válido até ${new Date(resumo.validade).toLocaleDateString("pt-BR")}.`
                : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={removendo}
            onClick={() => startRemover(async () => { await removerCertificadoNfse(); toast.success("Certificado removido."); })}
          >
            <Trash2 className="size-4" /> Remover
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
          <FileBadge className="size-5 shrink-0" />
          Nenhum certificado instalado ainda. Faça o upload do e-CNPJ A1 da empresa.
        </div>
      )}

      <form action={action} className="grid max-w-md gap-3">
        <div className="grid gap-2">
          <Label htmlFor="pfx">{resumo ? "Substituir certificado (.pfx / .p12)" : "Certificado A1 (.pfx / .p12)"}</Label>
          <Input id="pfx" name="pfx" type="file" accept=".pfx,.p12" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="senha">Senha do certificado</Label>
          <Input id="senha" name="senha" type="password" autoComplete="off" required />
        </div>
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Validando…" : "Enviar certificado"}
        </Button>
        <p className="text-xs text-muted-foreground">
          O arquivo é validado e guardado criptografado (AES-256). A senha nunca aparece em tela.
        </p>
      </form>
    </div>
  );
}
