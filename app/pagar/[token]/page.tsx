import { createAdminClient } from "@/lib/supabase/admin";
import { formatBRL, formatDate } from "@/lib/format";
import { PixBox } from "@/components/pagar/pix-box";
import { CartaoForm } from "@/components/pagar/cartao-form";

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

  const [{ data: tenant }, { data: ar }, { data: integ }, { data: cliente }] = await Promise.all([
    admin.from("tenants").select("nome_fantasia, logo_url, cor_primaria").eq("id", charge.tenant_id).maybeSingle(),
    charge.ar_id
      ? admin.from("accounts_receivable").select("descricao").eq("id", charge.ar_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from("payment_integrations").select("juros_cartao_pct").eq("tenant_id", charge.tenant_id).maybeSingle(),
    charge.client_id
      ? admin.from("clients").select("razao_social, documento, email, telefone, cep, numero").eq("id", charge.client_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const t = tenant as { nome_fantasia: string | null; logo_url: string | null; cor_primaria: string | null } | null;
  const empresa = t?.nome_fantasia ?? "Pagamento";
  const cor = t?.cor_primaria ?? "#10b981";
  const descricao = (ar as { descricao: string } | null)?.descricao ?? "Cobrança";
  const cancelada = charge.status === "cancelado" || charge.status === "estornado";
  const jurosPct = Number((integ as { juros_cartao_pct: number | null } | null)?.juros_cartao_pct ?? 0);
  const c = cliente as
    | { razao_social: string; documento: string | null; email: string | null; telefone: string | null; cep: string | null; numero: string | null }
    | null;
  const holderPrefill = {
    nome: c?.razao_social ?? "",
    cpf: c?.documento ?? "",
    email: c?.email ?? "",
    telefone: c?.telefone ?? "",
    cep: c?.cep ?? "",
    numero: c?.numero ?? "",
  };

  return (
    <Shell cor={cor} empresa={empresa} logo={t?.logo_url ?? undefined}>
      <div className="mb-6 text-center">
        <p className="text-sm text-white/55">{descricao}</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight text-white tabular-nums">{formatBRL(charge.valor)}</p>
        {charge.vencimento && (
          <p className="mt-1.5 text-xs text-white/40">Vencimento: {formatDate(charge.vencimento)}</p>
        )}
      </div>

      {cancelada ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/60">
          Esta cobrança foi {charge.status === "estornado" ? "estornada" : "cancelada"}.
        </p>
      ) : charge.status === "pago" ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-emerald-400 text-2xl text-[#052E1F]">✓</span>
          <p className="text-lg font-bold text-emerald-300">Pagamento confirmado!</p>
        </div>
      ) : charge.tipo === "pix" ? (
        <PixBox
          token={token}
          pixPayload={charge.pix_payload}
          pixQrImage={charge.pix_qr}
          statusInicial={charge.status}
        />
      ) : charge.tipo === "cartao" ? (
        <CartaoForm token={token} valorBase={charge.valor} jurosPct={jurosPct} holder={holderPrefill} cor={cor} />
      ) : charge.invoice_url ? (
        <a
          href={charge.invoice_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-2xl px-4 py-4 text-center text-sm font-bold text-[#052E1F]"
          style={{ backgroundColor: cor }}
        >
          Abrir cobrança ({charge.tipo === "boleto" ? "boleto" : "pagamento"})
        </a>
      ) : (
        <p className="text-center text-sm text-white/55">Cobrança indisponível no momento.</p>
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
    <main className="flex min-h-screen items-center justify-center bg-[#08140F] p-5">
      <div className="w-full max-w-sm rounded-[28px] border border-white/[0.06] bg-[#0E2A20] p-6 shadow-2xl shadow-black/40">
        <div className="mb-6 flex flex-col items-center gap-2.5">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={empresa} className="h-14 object-contain" />
          ) : (
            <span
              className="flex size-14 items-center justify-center rounded-2xl text-xl font-bold text-[#052E1F]"
              style={{ backgroundColor: cor }}
            >
              {empresa.charAt(0)}
            </span>
          )}
          <p className="text-lg font-bold text-white">{empresa}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
