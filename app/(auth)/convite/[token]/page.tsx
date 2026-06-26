import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth";
import { ROLE_LABELS, type AppRole } from "@/lib/types";
import { SubmitButton } from "@/components/auth/submit-button";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function acceptAction(formData: FormData) {
  "use server";
  const token = String(formData.get("token"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invitation", { p_token: token });
  if (error) redirect(`/convite/${token}?erro=1`);
  await supabase.auth.refreshSession();
  redirect("/dashboard");
}

export default async function ConvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { token } = await params;
  const { erro } = await searchParams;

  const supabase = await createClient();
  const { data: inv } = await supabase
    .from("invitations")
    .select("email, role, status, expires_at, tenants(razao_social)")
    .eq("token", token)
    .maybeSingle();

  const invitation = inv as
    | {
        email: string;
        role: AppRole;
        status: string;
        expires_at: string;
        tenants: { razao_social: string } | null;
      }
    | null;

  const invalido =
    !invitation ||
    invitation.status !== "pending" ||
    new Date(invitation.expires_at) < new Date();

  if (invalido) {
    return (
      <AuthShell>
        <Card>
        <CardHeader>
          <CardTitle>Convite inválido</CardTitle>
          <CardDescription>
            Este convite não existe, já foi usado ou expirou.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Ir para o login</Link>
          </Button>
        </CardContent>
        </Card>
      </AuthShell>
    );
  }

  const ctx = await getAuthContext();
  const empresa = invitation.tenants?.razao_social ?? "a empresa";

  return (
    <AuthShell>
      <Card>
      <CardHeader>
        <CardTitle>Convite para {empresa}</CardTitle>
        <CardDescription>
          Você foi convidado como{" "}
          <strong>{ROLE_LABELS[invitation.role]}</strong> ({invitation.email}).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {erro && (
          <p className="text-sm text-destructive">
            Não foi possível aceitar o convite. Verifique se está logado com{" "}
            {invitation.email}.
          </p>
        )}
        {ctx ? (
          <form action={acceptAction}>
            <input type="hidden" name="token" value={token} />
            <SubmitButton>Aceitar convite</SubmitButton>
          </form>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Entre ou crie sua conta para aceitar.
            </p>
            <Button asChild className="w-full">
              <Link href={`/login?next=/convite/${token}`}>Entrar</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/signup?next=/convite/${token}`}>Criar conta</Link>
            </Button>
          </div>
        )}
      </CardContent>
      </Card>
    </AuthShell>
  );
}
