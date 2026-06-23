"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, ClipboardList, ShieldCheck, Wallet } from "lucide-react";

import { loginAction, type FormState } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { GoogleButton } from "@/components/auth/google-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HIGHLIGHTS = [
  {
    icon: ClipboardList,
    title: "Ordens de serviço no campo",
    desc: "O técnico executa pelo celular e emite o certificado na hora — mesmo offline.",
  },
  {
    icon: ShieldCheck,
    title: "MIP com QR Code",
    desc: "Monitoramento de pragas com laudo técnico pronto para o cliente e a vigilância.",
  },
  {
    icon: Wallet,
    title: "Financeiro & cobrança",
    desc: "Contas, inadimplência, PIX e contratos recorrentes num só lugar.",
  },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <BrandPanel />
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function BrandPanel() {
  return (
    <section className="relative hidden flex-col justify-between overflow-hidden border-r border-border/50 bg-gradient-to-br from-primary/15 via-card to-background p-12 lg:flex">
      {/* Brilhos decorativos */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-20 size-96 rounded-full bg-primary/10 blur-3xl"
      />
      {/* Textura de grade */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:32px_32px]"
      />

      <Link href="/" className="relative flex items-center gap-2.5">
        <Image
          src="/logo/dedetech-simbolo-branco.png"
          alt="Dedetech"
          width={36}
          height={36}
          className="size-9"
          priority
        />
        <span className="text-xl font-semibold tracking-tight">Dedetech</span>
      </Link>

      <div className="relative max-w-md space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-balance">
            O sistema completo da sua dedetizadora.
          </h1>
          <p className="text-muted-foreground">
            Tire a operação do caderno e do WhatsApp. Funil, ordens de serviço,
            estoque, MIP e financeiro num só lugar.
          </p>
        </div>

        <ul className="space-y-5">
          {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
            <li key={title} className="flex gap-3.5">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
                <Icon className="size-5" />
              </span>
              <div className="space-y-0.5">
                <p className="font-medium leading-tight">{title}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-sm text-muted-foreground">
        Gestão para empresas de controle de pragas.
      </p>
    </section>
  );
}

function LoginForm() {
  const [state, formAction] = useActionState<FormState, FormData>(
    loginAction,
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const next = useSearchParams().get("next") ?? "/dashboard";

  return (
    <main className="flex flex-col justify-center px-6 py-12 sm:px-12">
      <div className="mx-auto w-full max-w-sm">
        {/* Logo (apenas no mobile, quando o painel de marca está oculto) */}
        <Link href="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
          <Image
            src="/logo/dedetech-simbolo-cor.png"
            alt="Dedetech"
            width={36}
            height={36}
            className="size-9"
            priority
          />
          <span className="text-xl font-semibold tracking-tight">Dedetech</span>
        </Link>

        <div className="mb-8 space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">
            Entrar na conta
          </h2>
          <p className="text-sm text-muted-foreground">
            Acesse o painel da sua empresa.
          </p>
        </div>

        <GoogleButton />

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou continue com e-mail
          <span className="h-px flex-1 bg-border" />
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />

          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com.br"
              required
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/recuperar"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Esqueci a senha
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="h-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {state?.error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </p>
          )}

          <SubmitButton>Entrar</SubmitButton>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground hover:underline"
          >
            Cadastre sua empresa
          </Link>
        </p>
      </div>
    </main>
  );
}
