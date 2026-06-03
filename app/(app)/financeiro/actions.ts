"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import {
  receivableSchema,
  payableSchema,
  bankAccountSchema,
  costCenterSchema,
  baixaSchema,
} from "@/lib/validators/financeiro";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "financeiro"];

// ─── Contas a Receber ────────────────────────────────────────────────
export async function salvarReceber(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "accounts_receivable",
    schema: receivableSchema,
    formData,
    roles: ROLES,
    path: "/financeiro/receber",
    id,
  });
}

export async function receber(
  id: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = baixaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Valor inválido" };

  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts_receivable")
    .select("valor, valor_pago")
    .eq("id", id)
    .maybeSingle();
  const row = data as { valor: number; valor_pago: number } | null;
  if (!row) return { error: "Conta não encontrada." };

  const novoPago = Number(row.valor_pago) + parsed.data.valor;
  const quitado = novoPago >= Number(row.valor);
  await supabase
    .from("accounts_receivable")
    .update({
      valor_pago: novoPago,
      status: quitado ? "quitado" : "parcial",
      pago_em: quitado ? new Date().toISOString() : null,
      bank_account_id: parsed.data.bank_account_id ?? null,
    })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);

  revalidatePath("/financeiro/receber");
  return { message: quitado ? "Recebimento quitado." : "Recebimento parcial." };
}

export async function cancelarReceber(id: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("accounts_receivable")
    .update({ status: "cancelado" })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath("/financeiro/receber");
}

export async function excluirReceber(id: string) {
  await deleteRecord("accounts_receivable", id, ROLES, "/financeiro/receber");
}

// ─── Contas a Pagar ──────────────────────────────────────────────────
export async function salvarPagar(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "accounts_payable",
    schema: payableSchema,
    formData,
    roles: ROLES,
    path: "/financeiro/pagar",
    id,
  });
}

export async function pagar(
  id: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);
  const parsed = baixaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Valor inválido" };

  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts_payable")
    .select("valor, valor_pago")
    .eq("id", id)
    .maybeSingle();
  const row = data as { valor: number; valor_pago: number } | null;
  if (!row) return { error: "Conta não encontrada." };

  const novoPago = Number(row.valor_pago) + parsed.data.valor;
  const quitado = novoPago >= Number(row.valor);
  await supabase
    .from("accounts_payable")
    .update({
      valor_pago: novoPago,
      status: quitado ? "quitado" : "parcial",
      pago_em: quitado ? new Date().toISOString() : null,
      bank_account_id: parsed.data.bank_account_id ?? null,
    })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);

  revalidatePath("/financeiro/pagar");
  return { message: quitado ? "Pagamento quitado." : "Pagamento parcial." };
}

export async function cancelarPagar(id: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("accounts_payable")
    .update({ status: "cancelado" })
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId);
  revalidatePath("/financeiro/pagar");
}

export async function excluirPagar(id: string) {
  await deleteRecord("accounts_payable", id, ROLES, "/financeiro/pagar");
}

// ─── Contas bancárias / Centros de custo ─────────────────────────────
export async function salvarBanco(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "bank_accounts",
    schema: bankAccountSchema,
    formData,
    roles: ROLES,
    path: "/financeiro",
    id,
  });
}
export async function excluirBanco(id: string) {
  await deleteRecord("bank_accounts", id, ROLES, "/financeiro");
}
export async function salvarCentro(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "cost_centers",
    schema: costCenterSchema,
    formData,
    roles: ROLES,
    path: "/financeiro",
    id,
  });
}
export async function excluirCentro(id: string) {
  await deleteRecord("cost_centers", id, ROLES, "/financeiro");
}

// ─── Gancho: OS executada → conta a receber ──────────────────────────
export async function gerarCobrancaDaOS(osId: string) {
  const ctx = await requireRole(["owner", "financeiro", "operacional"]);
  const supabase = await createClient();

  const { data: osData } = await supabase
    .from("service_orders")
    .select("id, numero, status, client_id, contract_id, quote_id")
    .eq("id", osId)
    .maybeSingle();
  const os = osData as {
    id: string;
    numero: number;
    status: string;
    client_id: string;
    contract_id: string | null;
    quote_id: string | null;
  } | null;
  if (!os || os.status === "faturada") redirect(`/os/${osId}`);

  // valor: do contrato, senão do orçamento, senão 0 (editar depois)
  let valor = 0;
  if (os.contract_id) {
    const { data: c } = await supabase
      .from("contracts")
      .select("valor")
      .eq("id", os.contract_id)
      .maybeSingle();
    valor = Number((c as { valor: number } | null)?.valor ?? 0);
  } else if (os.quote_id) {
    const { data: q } = await supabase
      .from("quotes")
      .select("desconto, quote_items(subtotal)")
      .eq("id", os.quote_id)
      .maybeSingle();
    const quote = q as { desconto: number; quote_items: { subtotal: number }[] } | null;
    if (quote) {
      const sub = quote.quote_items.reduce((s, i) => s + Number(i.subtotal), 0);
      valor = sub - Number(quote.desconto);
    }
  }

  const venc = new Date();
  venc.setDate(venc.getDate() + 7);

  await supabase.from("accounts_receivable").insert({
    tenant_id: ctx.tenantId,
    client_id: os.client_id,
    os_id: os.id,
    contract_id: os.contract_id,
    descricao: `OS #${os.numero}`,
    valor,
    vencimento: venc.toISOString().slice(0, 10),
  });
  await supabase
    .from("service_orders")
    .update({ status: "faturada" })
    .eq("id", os.id)
    .eq("tenant_id", ctx.tenantId);

  redirect("/financeiro/receber");
}
