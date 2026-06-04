import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { parsePedido, type PedidoParseado } from "./parse-pedido";

type Db = SupabaseClient;

const onlyDigits = (s: string | null | undefined) =>
  (s ?? "").replace(/\D/g, "");

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

// ─── Fornecedor: acha pelo CNPJ ou cria ──────────────────────────────
async function resolverFornecedor(
  db: Db,
  tenantId: string,
  p: PedidoParseado,
): Promise<string | null> {
  const cnpjDigits = onlyDigits(p.fornecedorCnpj);

  const { data } = await db
    .from("suppliers")
    .select("id, cnpj, razao_social")
    .eq("tenant_id", tenantId);
  const suppliers =
    (data as { id: string; cnpj: string | null; razao_social: string }[] | null) ??
    [];

  if (cnpjDigits) {
    const hit = suppliers.find((s) => onlyDigits(s.cnpj) === cnpjDigits);
    if (hit) return hit.id;
  } else if (p.fornecedorNome) {
    const hit = suppliers.find(
      (s) => norm(s.razao_social) === norm(p.fornecedorNome!),
    );
    if (hit) return hit.id;
  }

  if (!p.fornecedorNome && !cnpjDigits) return null;

  const { data: created } = await db
    .from("suppliers")
    .insert({
      tenant_id: tenantId,
      razao_social: p.fornecedorNome ?? "Fornecedor",
      cnpj: p.fornecedorCnpj ?? null,
      categoria: "saneante",
    })
    .select("id")
    .single();
  return (created as { id: string } | null)?.id ?? null;
}

// ─── Casa item do pedido com um produto do catálogo ──────────────────
type ProdRef = {
  id: string;
  nome_comercial: string;
  codigo_interno: string | null;
};

function casarProduto(
  codigo: string,
  descricao: string,
  deParaMap: Map<string, string>,
  produtos: ProdRef[],
): string | null {
  const porDePara = deParaMap.get(codigo);
  if (porDePara) return porDePara;

  const d = norm(descricao);
  const porCodigo = produtos.find(
    (p) => p.codigo_interno && p.codigo_interno.trim() === codigo,
  );
  if (porCodigo) return porCodigo.id;

  const porNome = produtos.find((p) => {
    const n = norm(p.nome_comercial);
    return n === d || n.startsWith(d) || d.startsWith(n);
  });
  return porNome?.id ?? null;
}

export type ImportarResultado = {
  orderId: string;
  numeroPedido: string | null;
  totalItens: number;
  jaConfirmado: boolean;
  valorTotal: number;
};

/**
 * Lê o texto do pedido, casa fornecedor + produtos (de-para/nome) e grava
 * o pedido como RASCUNHO + itens. Idempotente: se o mesmo pedido já existir,
 * reaproveita (ou sinaliza que já foi confirmado).
 */
export async function importarPedidoDoTexto(opts: {
  db: Db;
  tenantId: string;
  userId?: string | null;
  texto: string;
  origem: "upload" | "telegram";
}): Promise<ImportarResultado> {
  const { db, tenantId, userId, texto, origem } = opts;
  const p = parsePedido(texto);

  if (p.itens.length === 0) {
    throw new Error("Não encontrei itens no PDF. Confira se é um pedido válido.");
  }

  const supplierId = await resolverFornecedor(db, tenantId, p);

  // idempotência: pedido já importado?
  if (p.numeroPedido && supplierId) {
    const { data: existente } = await db
      .from("purchase_orders")
      .select("id, status")
      .eq("tenant_id", tenantId)
      .eq("supplier_id", supplierId)
      .eq("numero_pedido", p.numeroPedido)
      .maybeSingle();
    const row = existente as { id: string; status: string } | null;
    if (row) {
      return {
        orderId: row.id,
        numeroPedido: p.numeroPedido,
        totalItens: p.itens.length,
        jaConfirmado: row.status === "confirmado",
        valorTotal: p.valorTotal,
      };
    }
  }

  // de-para + catálogo p/ casar os itens
  const [{ data: dpData }, { data: prodData }] = await Promise.all([
    supplierId
      ? db
          .from("supplier_product_codes")
          .select("codigo_fornecedor, product_id")
          .eq("tenant_id", tenantId)
          .eq("supplier_id", supplierId)
      : Promise.resolve({ data: [] }),
    db
      .from("products")
      .select("id, nome_comercial, codigo_interno")
      .eq("tenant_id", tenantId),
  ]);
  const deParaMap = new Map<string, string>(
    ((dpData as { codigo_fornecedor: string; product_id: string }[] | null) ?? [])
      .map((r) => [r.codigo_fornecedor, r.product_id] as const),
  );
  const produtos = (prodData as ProdRef[] | null) ?? [];

  const { data: orderRow, error } = await db
    .from("purchase_orders")
    .insert({
      tenant_id: tenantId,
      supplier_id: supplierId,
      numero_pedido: p.numeroPedido,
      fornecedor_cnpj: p.fornecedorCnpj,
      fornecedor_nome: p.fornecedorNome,
      emitido_em: p.emitidoEm,
      valor_total: p.valorTotal,
      origem,
      raw_text: texto.slice(0, 20000),
      created_by: userId ?? null,
    })
    .select("id")
    .single();
  if (error || !orderRow) {
    throw new Error("Não foi possível salvar o pedido.");
  }
  const orderId = (orderRow as { id: string }).id;

  const itens = p.itens.map((it, idx) => {
    const productId = casarProduto(it.codigo, it.descricao, deParaMap, produtos);
    return {
      tenant_id: tenantId,
      purchase_order_id: orderId,
      codigo_fornecedor: it.codigo,
      descricao: it.descricao,
      quantidade: it.quantidade,
      valor_unitario: it.valorUnitario,
      valor_total: it.valorTotal,
      product_id: productId,
      criar_novo: !productId,
      ordem: idx,
    };
  });
  await db.from("purchase_order_items").insert(itens);

  return {
    orderId,
    numeroPedido: p.numeroPedido,
    totalItens: p.itens.length,
    jaConfirmado: false,
    valorTotal: p.valorTotal,
  };
}

// ─── Confirmação: aplica no estoque + financeiro ─────────────────────
const round2 = (n: number) => Math.round(n * 100) / 100;

export type ConfirmarOpts = {
  db: Db;
  tenantId: string;
  userId?: string | null;
  orderId: string;
  parcelas: number;
  primeiroVencimento: string; // yyyy-mm-dd
  intervaloDias: number;
  atualizarCusto: boolean;
};

/**
 * Confirma o pedido: cria/atualiza produtos, dá entrada no estoque (lote +
 * movimentação) e lança as contas a pagar (parceladas). Marca como confirmado.
 */
export async function confirmarPedido(opts: ConfirmarOpts): Promise<void> {
  const {
    db,
    tenantId,
    userId,
    orderId,
    parcelas,
    primeiroVencimento,
    intervaloDias,
    atualizarCusto,
  } = opts;

  const { data: orderData } = await db
    .from("purchase_orders")
    .select("id, status, supplier_id, numero_pedido, fornecedor_nome, emitido_em, valor_total")
    .eq("id", orderId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  const order = orderData as {
    id: string;
    status: string;
    supplier_id: string | null;
    numero_pedido: string | null;
    fornecedor_nome: string | null;
    emitido_em: string | null;
    valor_total: number;
  } | null;
  if (!order) throw new Error("Pedido não encontrado.");
  if (order.status === "confirmado") return; // idempotente

  const { data: itemData } = await db
    .from("purchase_order_items")
    .select("*")
    .eq("purchase_order_id", orderId)
    .eq("tenant_id", tenantId)
    .order("ordem");
  const itens =
    (itemData as {
      id: string;
      codigo_fornecedor: string | null;
      descricao: string;
      quantidade: number;
      valor_unitario: number;
      product_id: string | null;
      criar_novo: boolean;
    }[] | null) ?? [];

  const hoje = new Date().toISOString().slice(0, 10);
  const dataEntrada = order.emitido_em ?? hoje;

  for (const it of itens) {
    // 1) resolve/garante o produto
    let productId = it.product_id;
    if (!productId) {
      const { data: novo } = await db
        .from("products")
        .insert({
          tenant_id: tenantId,
          nome_comercial: it.descricao,
          codigo_interno: it.codigo_fornecedor,
          preco_custo: it.valor_unitario,
          fornecedor_id: order.supplier_id,
          ativo: true,
        })
        .select("id")
        .single();
      productId = (novo as { id: string } | null)?.id ?? null;
    } else if (atualizarCusto) {
      await db
        .from("products")
        .update({ preco_custo: it.valor_unitario })
        .eq("id", productId)
        .eq("tenant_id", tenantId);
    }
    if (!productId) continue;

    // 2) de-para (lembra o código do fornecedor p/ próximas importações)
    if (order.supplier_id && it.codigo_fornecedor) {
      await db.from("supplier_product_codes").upsert(
        {
          tenant_id: tenantId,
          supplier_id: order.supplier_id,
          codigo_fornecedor: it.codigo_fornecedor,
          product_id: productId,
        },
        { onConflict: "tenant_id,supplier_id,codigo_fornecedor" },
      );
    }

    // sincroniza o item com o produto efetivo
    if (it.product_id !== productId) {
      await db
        .from("purchase_order_items")
        .update({ product_id: productId, criar_novo: false })
        .eq("id", it.id);
    }

    // 3) entrada no estoque (lote + movimentação; trigger soma o saldo)
    const { data: batch } = await db
      .from("stock_batches")
      .insert({
        tenant_id: tenantId,
        product_id: productId,
        nf_entrada: order.numero_pedido,
        data_entrada: dataEntrada,
        qtd_entrada: it.quantidade,
        qtd_atual: 0,
      })
      .select("id")
      .single();
    const batchId = (batch as { id: string } | null)?.id;
    if (batchId) {
      await db.from("stock_movements").insert({
        tenant_id: tenantId,
        product_id: productId,
        batch_id: batchId,
        tipo: "entrada",
        quantidade: it.quantidade,
        motivo: `Pedido ${order.numero_pedido ?? ""}`.trim(),
        created_by: userId ?? null,
      });
    }
  }

  // 4) contas a pagar (parceladas)
  const nParc = Math.max(1, Math.floor(parcelas));
  const total = Number(order.valor_total);
  const base = round2(total / nParc);
  const fornec = order.fornecedor_nome ?? "fornecedor";

  const contas = Array.from({ length: nParc }, (_, i) => {
    const valor = i === nParc - 1 ? round2(total - base * (nParc - 1)) : base;
    const venc = new Date(`${primeiroVencimento}T00:00:00`);
    venc.setDate(venc.getDate() + i * intervaloDias);
    const sufixo = nParc > 1 ? ` (parcela ${i + 1}/${nParc})` : "";
    return {
      tenant_id: tenantId,
      supplier_id: order.supplier_id,
      descricao: `Pedido #${order.numero_pedido ?? "s/n"} — ${fornec}${sufixo}`,
      valor,
      vencimento: venc.toISOString().slice(0, 10),
      status: "a_vencer",
    };
  });
  await db.from("accounts_payable").insert(contas);

  // 5) fecha o pedido
  await db
    .from("purchase_orders")
    .update({
      status: "confirmado",
      parcelas: nParc,
      confirmado_em: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("tenant_id", tenantId);
}
