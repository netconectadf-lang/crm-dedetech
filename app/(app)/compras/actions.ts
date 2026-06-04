"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { SaveState } from "@/lib/crud-helpers";
import { extractPdfText } from "@/lib/compras/extract-pdf";
import { importarPedidoDoTexto, confirmarPedido } from "@/lib/compras/importar";
import { confirmarPedidoSchema, itemMapSchema } from "@/lib/validators/compras";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "operacional", "financeiro"];

/** Recebe o PDF, lê e cria o pedido (rascunho). Redireciona p/ conferência. */
export async function importarPedidoUpload(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);

  const file = formData.get("arquivo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione o PDF do pedido." };
  }
  if (file.type && !file.type.includes("pdf")) {
    return { error: "Envie um arquivo PDF." };
  }

  let orderId: string;
  try {
    const texto = await extractPdfText(await file.arrayBuffer());
    const supabase = await createClient();
    const res = await importarPedidoDoTexto({
      db: supabase,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      texto,
      origem: "upload",
    });
    orderId = res.orderId;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao ler o PDF." };
  }

  revalidatePath("/compras");
  redirect(`/compras/${orderId}`);
}

/** Confirma o pedido: produtos + estoque + contas a pagar parceladas. */
export async function confirmarPedidoAction(
  orderId: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const ctx = await requireRole(ROLES);

  const parsed = confirmarPedidoSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  let itensMap: { id: string; value: string }[] = [];
  try {
    itensMap = itemMapSchema.parse(JSON.parse(parsed.data.itens));
  } catch {
    return { error: "Conferência inválida." };
  }

  const supabase = await createClient();

  // aplica o de-para escolhido na tela
  for (const m of itensMap) {
    const novo = m.value === "novo";
    await supabase
      .from("purchase_order_items")
      .update({ product_id: novo ? null : m.value, criar_novo: novo })
      .eq("id", m.id)
      .eq("tenant_id", ctx.tenantId);
  }

  try {
    await confirmarPedido({
      db: supabase,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      orderId,
      parcelas: parsed.data.parcelas,
      primeiroVencimento: parsed.data.primeiro_vencimento,
      intervaloDias: parsed.data.intervalo_dias,
      atualizarCusto: parsed.data.atualizar_custo,
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Falha ao confirmar o pedido.",
    };
  }

  revalidatePath("/compras");
  revalidatePath("/estoque");
  revalidatePath("/financeiro/pagar");
  redirect("/financeiro/pagar");
}

export async function excluirPedido(id: string) {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  await supabase
    .from("purchase_orders")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "rascunho"); // confirmados não se apagam por aqui
  revalidatePath("/compras");
}
