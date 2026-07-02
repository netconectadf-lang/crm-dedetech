import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ConfigForm } from "@/components/app/config-form";
import { PageHeader } from "@/components/app/page-header";
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
      "razao_social, nome_fantasia, registro_vigilancia_sanitaria, cor_primaria, logo_url, preco_combustivel_litro, custo_hora_padrao, nfse_inscricao_municipal, nfse_codigo_municipio, nfse_item_lista_servico, nfse_aliquota_iss, nfse_iss_retido, email_remetente_nome, email_responder_para, google_review_url",
    )
    .eq("id", ctx.tenantId)
    .single();

  const tenant = data as {
    razao_social: string;
    nome_fantasia: string | null;
    registro_vigilancia_sanitaria: string | null;
    cor_primaria: string | null;
    logo_url: string | null;
    preco_combustivel_litro: number | null;
    custo_hora_padrao: number | null;
    nfse_inscricao_municipal: string | null;
    nfse_codigo_municipio: string | null;
    nfse_item_lista_servico: string | null;
    nfse_aliquota_iss: number | null;
    nfse_iss_retido: boolean | null;
    email_remetente_nome: string | null;
    email_responder_para: string | null;
    google_review_url: string | null;
  } | null;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Configurações"
        description="Dados da empresa, usados nos documentos e no mini-site."
      />

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
