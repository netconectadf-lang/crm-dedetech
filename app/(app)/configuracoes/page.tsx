import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ConfigForm } from "@/components/app/config-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const ctx = await requireRole(["owner"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("tenants")
    .select(
      "razao_social, nome_fantasia, registro_vigilancia_sanitaria, cor_primaria",
    )
    .eq("id", ctx.tenantId)
    .single();

  const tenant = data as {
    razao_social: string;
    nome_fantasia: string | null;
    registro_vigilancia_sanitaria: string | null;
    cor_primaria: string | null;
  } | null;

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Dados da empresa, usados nos documentos e no mini-site.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da empresa</CardTitle>
          <CardDescription>
            Essas informações aparecem em certificados, laudos e na vitrine.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenant && <ConfigForm tenant={tenant} />}
        </CardContent>
      </Card>
    </main>
  );
}
