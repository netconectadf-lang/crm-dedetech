"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { criarCobrancaAsaas } from "@/lib/asaas";
import { dispatch } from "@/lib/notify/dispatch";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "financeiro"];

/**
 * Gera uma cobrança (boleto/PIX) para uma Conta a Receber. Usa o Asaas quando
 * configurado; sem credencial, registra uma cobrança MANUAL. Notifica o cliente
 * com o link (inerte sem WhatsApp/e-mail).
 */
export async function gerarCobranca(arId: string, tipo: "boleto" | "pix") {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();

  const { data: arData } = await supabase
    .from("accounts_receivable")
    .select("id, descricao, valor, vencimento, client_id, clients(razao_social, telefone, email)")
    .eq("id", arId)
    .maybeSingle();
  const ar = arData as unknown as {
    id: string;
    descricao: string;
    valor: number;
    vencimento: string;
    client_id: string | null;
    clients: { razao_social: string; telefone: string | null; email: string | null } | null;
  } | null;
  if (!ar) return;

  const asaas = await criarCobrancaAsaas({
    valor: Number(ar.valor),
    vencimento: ar.vencimento,
    descricao: ar.descricao,
    tipo,
  });

  const { data: chargeData } = await supabase
    .from("charges")
    .insert({
      tenant_id: ctx.tenantId,
      ar_id: ar.id,
      client_id: ar.client_id,
      provider: asaas.skipped ? "manual" : "asaas",
      tipo,
      valor: ar.valor,
      vencimento: ar.vencimento,
      provider_charge_id: asaas.id ?? null,
      invoice_url: asaas.invoiceUrl ?? null,
      pix_payload: asaas.pixPayload ?? null,
    })
    .select("id, invoice_url")
    .single();
  const charge = chargeData as { id: string; invoice_url: string | null } | null;

  // notifica o cliente (inerte sem provider)
  if (ar.clients?.telefone) {
    const link = charge?.invoice_url ?? "(em processamento)";
    await dispatch({
      tenantId: ctx.tenantId,
      canal: "whatsapp",
      destino: ar.clients.telefone,
      corpo: `Olá! Sua cobrança "${ar.descricao}" está disponível: ${link}`,
      related_kind: "cobranca",
      related_id: charge?.id,
    });
  }

  revalidatePath("/financeiro/receber");
}
