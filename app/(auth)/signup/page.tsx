"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signupAction, type FormState } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [state, formAction] = useActionState<FormState, FormData>(
    signupAction,
    null,
  );

  return (
    <AuthShell>
      <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>
          Comece o teste grátis da sua dedetizadora.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleButton />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou{" "}
          <span className="h-px flex-1 bg-border" />
        </div>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Seu nome</Label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="empresa">Empresa (razão social)</Label>
            <Input id="empresa" name="empresa" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cnpj">CNPJ (opcional)</Label>
            <Input id="cnpj" name="cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state?.message && (
            <p className="text-sm text-primary">{state.message}</p>
          )}
          <SubmitButton>Criar conta</SubmitButton>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
      </Card>
    </AuthShell>
  );
}
