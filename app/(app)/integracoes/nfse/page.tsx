import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/auth";
import { resumoCertificado, carregarConfigFiscal } from "@/lib/nfse-gov/store";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CertUpload } from "@/components/integracoes/cert-upload";
import { NfseConfigForm } from "@/components/integracoes/nfse-config-form";

export const metadata = { title: "NFS-e Nacional" };

export default async function IntegracaoNfsePage() {
  const ctx = await requireRole(["owner"]);
  const [resumo, config] = await Promise.all([
    resumoCertificado(ctx.tenantId),
    carregarConfigFiscal(ctx.tenantId),
  ]);

  const cfg = config ?? {
    cnpj: null,
    inscricaoMunicipal: null,
    codigoMunicipio: null,
    codTribNacional: null,
    aliquotaIss: null,
    issRetido: false,
    opSimplesNacional: 3,
    regimeEspecial: 0,
    ambiente: 2,
    serie: "1",
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6 lg:p-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/integracoes">
            <ArrowLeft className="size-4" /> Integrações
          </Link>
        </Button>
        <PageHeader
          title="NFS-e Nacional"
          description="Emita nota fiscal de serviço direto pelo Sistema Nacional NFS-e (gov.br), sem provedor pago."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Certificado digital A1</CardTitle>
          <CardDescription>
            O e-CNPJ A1 (.pfx) da sua empresa assina as notas. Compre numa AC ICP-Brasil (Certisign,
            Serasa etc.) e credencie o CNPJ no portal do Sistema Nacional NFS-e.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CertUpload resumo={resumo} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados fiscais</CardTitle>
          <CardDescription>
            Confirme estes dados com seu contador. O código de tributação nacional (6 dígitos) e a
            alíquota do ISS variam por município.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NfseConfigForm config={cfg} />
        </CardContent>
      </Card>
    </main>
  );
}
