"use client";

import { useState } from "react";
import { calcularParcelas } from "@/lib/parcelas";
import { formatBRL } from "@/lib/format";

type Holder = { nome: string; cpf: string; cep: string; numero: string; telefone: string; email: string };

export function CartaoForm({
  token,
  valorBase,
  jurosPct,
  holder,
  cor,
}: {
  token: string;
  valorBase: number;
  jurosPct: number;
  holder: Partial<Holder>;
  cor: string;
}) {
  const opcoes = calcularParcelas(valorBase, jurosPct);
  const [parcelas, setParcelas] = useState(1);
  const [card, setCard] = useState({ number: "", holderName: "", expiry: "", ccv: "" });
  const [h, setH] = useState<Holder>({
    nome: holder.nome ?? "",
    cpf: holder.cpf ?? "",
    cep: holder.cep ?? "",
    numero: holder.numero ?? "",
    telefone: holder.telefone ?? "",
    email: holder.email ?? "",
  });
  const [estado, setEstado] = useState<"idle" | "processando" | "ok" | "erro">("idle");
  const [erro, setErro] = useState("");

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("processando");
    setErro("");
    const [mm, yyRaw] = card.expiry.split("/").map((s) => s.trim());
    const yy = yyRaw ?? "";
    const expiryYear = yy.length === 2 ? `20${yy}` : yy;
    try {
      const r = await fetch(`/api/pagar/${token}/cartao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelas,
          card: { number: card.number, holderName: card.holderName, expiryMonth: mm, expiryYear, ccv: card.ccv },
          holder: h,
        }),
      });
      const j = (await r.json()) as { ok: boolean; error?: string };
      if (j.ok) setEstado("ok");
      else {
        setEstado("erro");
        setErro(j.error ?? "Pagamento não aprovado.");
      }
    } catch {
      setEstado("erro");
      setErro("Falha de conexão. Tente novamente.");
    }
  }

  if (estado === "ok") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white">✓</span>
        <p className="text-lg font-semibold text-emerald-700">Pagamento aprovado!</p>
        <p className="text-sm text-muted-foreground">Obrigado. Seu pagamento foi confirmado.</p>
      </div>
    );
  }

  const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  return (
    <form onSubmit={pagar} className="grid gap-3">
      <div className="grid gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Parcelas</label>
        <select
          value={parcelas}
          onChange={(e) => setParcelas(Number(e.target.value))}
          className={inputCls}
        >
          {opcoes.map((o) => (
            <option key={o.n} value={o.n}>
              {o.n}x de {formatBRL(o.valorParcela)}
              {o.juros ? ` (total ${formatBRL(o.total)})` : " sem juros"}
            </option>
          ))}
        </select>
      </div>

      <input className={inputCls} placeholder="Número do cartão" inputMode="numeric"
        value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} required />
      <input className={inputCls} placeholder="Nome impresso no cartão"
        value={card.holderName} onChange={(e) => setCard({ ...card, holderName: e.target.value })} required />
      <div className="grid grid-cols-2 gap-3">
        <input className={inputCls} placeholder="Validade MM/AA"
          value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} required />
        <input className={inputCls} placeholder="CVV" inputMode="numeric"
          value={card.ccv} onChange={(e) => setCard({ ...card, ccv: e.target.value })} required />
      </div>

      <p className="mt-1 text-xs font-medium text-muted-foreground">Dados do titular</p>
      <input className={inputCls} placeholder="CPF do titular" inputMode="numeric"
        value={h.cpf} onChange={(e) => setH({ ...h, cpf: e.target.value })} required />
      <div className="grid grid-cols-2 gap-3">
        <input className={inputCls} placeholder="CEP" inputMode="numeric"
          value={h.cep} onChange={(e) => setH({ ...h, cep: e.target.value })} required />
        <input className={inputCls} placeholder="Nº" value={h.numero}
          onChange={(e) => setH({ ...h, numero: e.target.value })} />
      </div>
      <input className={inputCls} placeholder="Telefone" inputMode="numeric"
        value={h.telefone} onChange={(e) => setH({ ...h, telefone: e.target.value })} required />

      {estado === "erro" && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{erro}</p>
      )}

      <button
        type="submit"
        disabled={estado === "processando"}
        className="mt-1 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        style={{ backgroundColor: cor }}
      >
        {estado === "processando" ? "Processando…" : "Pagar com cartão"}
      </button>
      <p className="text-center text-[11px] text-muted-foreground">
        Pagamento seguro processado pelo Asaas. Não armazenamos os dados do cartão.
      </p>
    </form>
  );
}
