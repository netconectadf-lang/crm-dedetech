"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  loginSchema,
  signupSchema,
  resetRequestSchema,
} from "@/lib/validators/auth";

export type FormState = { error?: string; message?: string } | null;

const RATE_MSG =
  "Muitas tentativas. Aguarde um minuto e tente novamente.";

async function appUrl() {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  // Anti força-bruta: 8 tentativas/min por e-mail+IP.
  const chave = `${parsed.data.email}:${await clientIp()}`;
  if (!(await rateLimit("login", { limit: 8, windowSeconds: 60, key: chave }))) {
    return { error: RATE_MSG };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "E-mail ou senha incorretos." };

  const next = String(formData.get("next") ?? "/dashboard");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signupAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    empresa: formData.get("empresa"),
    cnpj: formData.get("cnpj"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { fullName, empresa, cnpj, email, password } = parsed.data;

  // Anti-abuso: 5 cadastros/min por IP.
  if (!(await rateLimit("signup", { limit: 5, windowSeconds: 60, key: await clientIp() }))) {
    return { error: RATE_MSG };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await appUrl()}/auth/callback?next=/dashboard`,
      data: { full_name: fullName, pending_empresa: empresa, pending_cnpj: cnpj },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already"))
      return { error: "Já existe uma conta com esse e-mail." };
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  // Confirmação de e-mail desligada → já vem sessão: provisiona a empresa agora.
  if (data.session) {
    const { error: rpcErr } = await supabase.rpc("provision_tenant", {
      p_razao_social: empresa,
      p_cnpj: cnpj ?? undefined,
    });
    if (rpcErr) return { error: "Conta criada, mas falhou ao criar a empresa." };
    await supabase.auth.refreshSession();
    redirect("/dashboard");
  }

  return {
    message:
      "Conta criada! Confirme o e-mail que enviamos para ativar o acesso.",
  };
}

export async function resetRequestAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "E-mail inválido" };

  // Anti-abuso de e-mails de reset: 4/min por e-mail+IP.
  const chave = `${parsed.data.email}:${await clientIp()}`;
  if (!(await rateLimit("reset", { limit: 4, windowSeconds: 60, key: chave }))) {
    return { error: RATE_MSG };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await appUrl()}/auth/callback?next=/dashboard`,
  });
  // Resposta neutra (não revela se o e-mail existe).
  return {
    message: "Se o e-mail existir, enviamos um link para redefinir a senha.",
  };
}

export async function googleSignInAction() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await appUrl()}/auth/callback?next=/dashboard` },
  });
  if (error || !data.url) redirect("/login?erro=oauth");
  redirect(data.url);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
