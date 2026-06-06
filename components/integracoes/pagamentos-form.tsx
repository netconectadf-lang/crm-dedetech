"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Loader2, Copy, Check, AlertTriangle, Wifi } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  testarConexao,
  salvarPagamentos,
  desconectarPagamentos,
} from "@/app/(app)/integracoes/pagamentos/actions";

type Props = {
  connected: boolean;
  accountName?: string;
  environment: "sandbox" | "production";
  walletId: string;
  webhookUrl: string;
  webhookToken: string;
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs">
          {value}
        </code>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

export function PagamentosForm({
  connected,
  accountName,
  environment,
  walletId,
  webhookUrl,
  webhookToken,
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [teste, setTeste] = useState<{ ok: boolean; nome?: string; error?: string } | null>(null);
  const [salvo, setSalvo] = useState<{ ok: boolean; error?: string; message?: string } | null>(null);

  function handleTestar() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    setSalvo(null);
    startTransition(async () => setTeste(await testarConexao(null, fd)));
  }

  function handleSalvar() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    setTeste(null);
    startTransition(async () => {
      const r = await salvarPagamentos(null, fd);
      setSalvo(r);
      if (r.ok) router.refresh();
    });
  }

  function handleDesconectar() {
    startTransition(async () => {
      await desconectarPagamentos();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form ref={formRef} className="space-y-5">
        <div className="space-y-2">
          <Label>Ambiente</Label>
          <div className="flex flex-wrap gap-3">
            {([
              { v: "sandbox", t: "Sandbox (testes)", d: "Cobranças fictícias para testar o fluxo." },
              { v: "production", t: "Produção (cobrar de verdade)", d: "Cobranças reais caem na sua conta." },
            ] as const).map((o) => (
              <label
                key={o.v}
                className="flex flex-1 cursor-pointer items-start gap-2.5 rounded-lg border border-border/60 p-3 text-sm has-[:checked]:border-primary/60 has-[:checked]:bg-primary/[0.04]"
              >
                <input
                  type="radio"
                  name="environment"
                  value={o.v}
                  defaultChecked={environment === o.v}
                  className="mt-0.5 accent-[var(--primary)]"
                />
                <span>
                  <span className="block font-medium">{o.t}</span>
                  <span className="block text-xs text-muted-foreground">{o.d}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="api_key">Chave de API do Asaas (access token)</Label>
          <Input
            id="api_key"
            name="api_key"
            type="password"
            placeholder={connected ? "•••••••• (preencha para trocar a chave)" : "$aact_..."}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            No painel do Asaas: <strong>Integrações ▸ Chave de API</strong>. Use a chave do mesmo ambiente selecionado acima.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="wallet_id">Wallet ID (opcional)</Label>
          <Input id="wallet_id" name="wallet_id" defaultValue={walletId} placeholder="para split/repasse — deixe em branco se não usa" autoComplete="off" />
        </div>

        {teste && (
          <p className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${teste.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>
            {teste.ok ? <CircleCheck className="size-4" /> : <AlertTriangle className="size-4" />}
            {teste.ok ? `Conexão OK${teste.nome ? ` — ${teste.nome}` : ""}` : teste.error}
          </p>
        )}
        {salvo && (
          <p className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${salvo.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>
            {salvo.ok ? <CircleCheck className="size-4" /> : <AlertTriangle className="size-4" />}
            {salvo.ok ? salvo.message : salvo.error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleTestar} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Wifi className="size-4" />} Testar conexão
          </Button>
          <Button type="button" onClick={handleSalvar} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <CircleCheck className="size-4" />}
            {connected ? "Salvar alterações" : "Conectar conta"}
          </Button>
          {connected && (
            <Button type="button" variant="ghost" className="text-muted-foreground" onClick={handleDesconectar} disabled={pending}>
              Desconectar
            </Button>
          )}
        </div>
      </form>

      {connected && (
        <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <CircleCheck className="size-4 text-emerald-400" />
            <p className="text-sm font-medium">
              Conta conectada{accountName ? ` — ${accountName}` : ""} ({environment === "production" ? "Produção" : "Sandbox"})
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Cole o <strong>webhook</strong> abaixo no Asaas (<em>Integrações ▸ Webhooks</em>) com o evento{" "}
            <strong>Cobranças</strong>. É assim que o sistema dá baixa automática quando o cliente paga.
          </p>
          <CopyField label="URL do webhook" value={webhookUrl} />
          <CopyField label="Token de autenticação (header asaas-access-token)" value={webhookToken} />
        </div>
      )}
    </div>
  );
}
