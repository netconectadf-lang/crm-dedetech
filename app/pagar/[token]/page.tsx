import { createAdminClient } from "@/lib/supabase/admin";
import { formatBRL, formatDate } from "@/lib/format";
import { PixBox } from "@/components/pagar/pix-box";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pagamento" };

type Charge = {
  id: string;
  valor: number;
  tipo: string;
  status: string;
  vencimento: string | null;
  pix_payload: string | null;
  pix_qr: string | null;
  invoice_url: string | null;
  ar_id: string | null;
  tenant_id: string;
  client_id: string | null;
};

export default async function PagarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: chargeData } = await admin
    .from("charges")
    .select("id, valor, tipo, status, vencimento, pix_payload, pix_qr, invoice_url, ar_id, tenant_id, client_id")
    .eq("pay_token", token)
    .maybeSingle();
  const charge = chargeData as Charge | null;

  if (!charge) {
    return (
      <Shell cor="#10b981" empresa="Pagamento">
        <p className="text-center text-sm text-muted-foreground">
          Cobrança não encontrada ou link inválido.
        </p>
      </Shell>
    );
  }

  const [{ data: tenant }, { data: ar }] = await Promise.all([
    admin.from("tenants").select("nome_fantasia, logo_url, cor_primaria").eq("id", charge.tenant_id).maybeSingle(),
    charge.ar_id
      ? admin.from("accounts_receivable").select("descricao").eq("id", charge.ar_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const t = tenant as { nome_fantasia: string | null; logo_url: string | null; cor_primaria: string | null } | null;
  const empresa = t?.nome_fantasia ?? "Pagamento";
  const cor = t?.cor_primaria ?? "#10b981";
  const descricao = (ar as { descricao: string } | null)?.descricao ?? "Cobrança";
  const cancelada = charge.status === "cancelado" || charge.status === "estornado";

  return (
    <Shell cor={cor} empresa={empresa} logo={t?.logo_url ?? undefined}>
      <div className="mb-5 text-center">
        <p className="text-sm text-muted-foreground">{descricao}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{formatBRL(charge.valor)}</p>
        {charge.vencimento && (
          <p className="mt-1 text-xs text-muted-foreground">Vencimento: {formatDate(charge.vencimento)}</p>
        )}
      </div>

      {cancelada ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          Esta cobrança foi {charge.status === "estornado" ? "estornada" : "cancelada"}.
        </p>
      ) : charge.tipo === "pix" ? (
        <PixBox
          token={token}
          pixPayload={charge.pix_payload}
          pixQrImage={charge.pix_qr}
          statusInicial={charge.status}
        />
      ) : charge.status === "pago" ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-6 text-center text-sm font-semibold text-emerald-700">
          Pagamento confirmado! ✓
        </p>
      ) : charge.invoice_url ? (
        <a
          href={charge.invoice_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-md px-4 py-3 text-center text-sm font-semibold text-white"
          style={{ backgroundColor: cor }}
        >
          Abrir cobrança ({charge.tipo === "boleto" ? "boleto" : "pagamento"})
        </a>
      ) : (
        <p className="text-center text-sm text-muted-foreground">Cobrança indisponível no momento.</p>
      )}
    </Shell>
  );
}

function Shell({
  cor,
  empresa,
  logo,
  children,
}: {
  cor: string;
  empresa: string;
  logo?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-lg">
        <div className="mb-5 flex flex-col items-center gap-2">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={empresa} className="h-12 object-contain" />
          ) : (
            <span
              className="flex size-12 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{ backgroundColor: cor }}
            >
              {empresa.charAt(0)}
            </span>
          )}
          <p className="font-semibold">{empresa}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
