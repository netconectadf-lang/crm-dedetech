"use client";

import { useState } from "react";
import { site } from "@/lib/site/site";

type Status = "idle" | "loading" | "ok" | "error";

const field =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-cream placeholder:text-fog/60 outline-none focus:border-emerald";

export function ContatoForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = {
      nome: String(form.get("nome") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      telefone: String(form.get("telefone") ?? "").trim(),
      empresa: String(form.get("empresa") ?? "").trim(),
      mensagem: String(form.get("mensagem") ?? "").trim(),
      website: String(form.get("website") ?? ""), // honeypot
      origem: "site-contato",
    };

    if (payload.nome.length < 2 || !payload.email.includes("@")) {
      return setError("Preencha nome e um e-mail válido.");
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setStatus("error");
        setError(j.error ?? "Não foi possível enviar. Tente novamente.");
        return;
      }
      setStatus("ok");
    } catch {
      setStatus("error");
      setError("Falha de conexão. Tente novamente.");
    }
  }

  if (status === "ok") {
    return (
      <div className="card rounded-2xl p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-cream">Recebemos seu contato ✅</h2>
        <p className="mt-3 text-fog">Nossa equipe vai te chamar em breve. Se preferir, fale agora no WhatsApp.</p>
        <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-6 inline-block rounded-full px-7 py-3.5">
          Falar no WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card rounded-2xl p-6 sm:p-8 space-y-4">
      {/* honeypot — escondido de humanos */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="nome" className="text-sm text-fog">Nome</label>
          <input id="nome" name="nome" required className={field} autoComplete="name" />
        </div>
        <div className="grid gap-2">
          <label htmlFor="empresa" className="text-sm text-fog">Empresa</label>
          <input id="empresa" name="empresa" className={field} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm text-fog">E-mail</label>
          <input id="email" name="email" type="email" required className={field} autoComplete="email" />
        </div>
        <div className="grid gap-2">
          <label htmlFor="telefone" className="text-sm text-fog">WhatsApp / Telefone</label>
          <input id="telefone" name="telefone" inputMode="tel" className={field} autoComplete="tel" />
        </div>
      </div>
      <div className="grid gap-2">
        <label htmlFor="mensagem" className="text-sm text-fog">Como podemos ajudar?</label>
        <textarea id="mensagem" name="mensagem" rows={4} className={field} placeholder="Conte um pouco sobre sua operação…" />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={status === "loading"} className="btn-primary w-full rounded-full px-7 py-3.5 disabled:opacity-60">
        {status === "loading" ? "Enviando…" : "Quero uma demonstração"}
      </button>
    </form>
  );
}
