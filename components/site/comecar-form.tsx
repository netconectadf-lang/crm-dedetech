"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site/site";
import { supabase } from "@/lib/site/supabase";

type Status = "idle" | "loading" | "confirm" | "ready" | "error";

const field =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-cream placeholder:text-fog/60 outline-none focus:border-emerald";

export function ComecarForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const empresa = String(form.get("empresa") ?? "").trim();
    const cnpjRaw = String(form.get("cnpj") ?? "").replace(/\D/g, "");
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (fullName.length < 2) return setError("Informe seu nome.");
    if (empresa.length < 2) return setError("Informe a razão social da empresa.");
    if (cnpjRaw && cnpjRaw.length !== 14) return setError("CNPJ deve ter 14 dígitos.");
    if (password.length < 8) return setError("A senha precisa de no mínimo 8 caracteres.");

    setStatus("loading");
    const cnpj = cnpjRaw || null;
    const { data, error: signErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: site.authCallback,
        data: { full_name: fullName, pending_empresa: empresa, pending_cnpj: cnpj },
      },
    });

    if (signErr) {
      setStatus("error");
      setError(
        signErr.message.toLowerCase().includes("already")
          ? "Já existe uma conta com esse e-mail."
          : "Não foi possível criar a conta. Tente novamente.",
      );
      return;
    }

    // Confirmação de e-mail desligada → já vem sessão: provisiona a empresa.
    if (data.session) {
      const { error: rpcErr } = await supabase.rpc("provision_tenant", {
        p_razao_social: empresa,
        p_cnpj: cnpj,
      });
      if (rpcErr) {
        setStatus("error");
        setError("Conta criada, mas falhou ao configurar a empresa. Faça login no sistema.");
        return;
      }
      setStatus("ready");
      return;
    }

    // Confirmação ligada → finaliza no /auth/callback do sistema.
    setStatus("confirm");
  }

  if (status === "confirm") {
    return (
      <div className="card rounded-2xl p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-cream">Confirme seu e-mail ✉️</h2>
        <p className="mt-3 text-fog">
          Enviamos um link de ativação. Clique nele para acessar o sistema e começar o teste grátis.
        </p>
      </div>
    );
  }

  if (status === "ready") {
    return (
      <div className="card rounded-2xl p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-cream">Conta criada! 🎉</h2>
        <p className="mt-3 text-fog">Sua dedetizadora já está configurada. Acesse o sistema:</p>
        <a href={site.login} className="btn-primary mt-6 inline-block rounded-full px-7 py-3.5">
          Entrar no sistema
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card rounded-2xl p-6 sm:p-8 space-y-4">
      <div className="grid gap-2">
        <label htmlFor="fullName" className="text-sm text-fog">Seu nome</label>
        <input id="fullName" name="fullName" required className={field} autoComplete="name" />
      </div>
      <div className="grid gap-2">
        <label htmlFor="empresa" className="text-sm text-fog">Empresa (razão social)</label>
        <input id="empresa" name="empresa" required className={field} />
      </div>
      <div className="grid gap-2">
        <label htmlFor="cnpj" className="text-sm text-fog">CNPJ (opcional)</label>
        <input id="cnpj" name="cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" className={field} />
      </div>
      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm text-fog">E-mail</label>
        <input id="email" name="email" type="email" required className={field} autoComplete="email" />
      </div>
      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm text-fog">Senha</label>
        <input id="password" name="password" type="password" required minLength={8} className={field} autoComplete="new-password" />
        <span className="text-xs text-fog/70">Mínimo de 8 caracteres.</span>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-primary w-full rounded-full px-7 py-3.5 disabled:opacity-60"
      >
        {status === "loading" ? "Criando conta…" : "Criar conta e começar grátis"}
      </button>

      <p className="text-center text-sm text-fog">
        Já tem conta?{" "}
        <a href={site.login} className="text-emerald hover:underline">Entrar</a>
      </p>
      <p className="text-center text-xs text-fog/70">
        Ao continuar você concorda em ser contatado pela equipe Dedetech.{" "}
        <Link href="/" className="underline">Voltar ao site</Link>
      </p>
    </form>
  );
}
