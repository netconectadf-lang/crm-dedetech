/**
 * Parser do pedido de compra no layout SERDI / VELO Sistema.
 *
 * O texto extraído do PDF embaralha as colunas: cada item sai como
 *   {valorTotal}{valorUnitário}{código} {descrição} {qtd} UN
 * ex.: "135,00135,00811 OLEO MINERAL 5LT 1 UN"
 *
 * É um parser puro (sem I/O) para ser testável. Recebe o texto já extraído.
 */

export type PedidoItem = {
  codigo: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
};

export type PedidoParseado = {
  numeroPedido: string | null;
  fornecedorCnpj: string | null;
  fornecedorNome: string | null;
  emitidoEm: string | null; // ISO yyyy-mm-dd
  itens: PedidoItem[];
  valorTotal: number;
};

/** "1.615,00" → 1615.0 ; "87,00" → 87.0 */
function brToNumber(s: string): number {
  return Number(s.replace(/\./g, "").replace(",", "."));
}

/** "16/01/2026 16:52:38" → "2026-01-16" */
function brDateToISO(s: string | undefined | null): string | null {
  if (!s) return null;
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

// {valorTotal}{valorUnit}{codigo} {descricao} {qtd} UN
const ITEM_RE =
  /([\d.]+,\d{2})([\d.]+,\d{2})(\d+)\s+(.+?)\s+(\d+)\s+UN(?=\s|$)/g;

export function parsePedido(textoBruto: string): PedidoParseado {
  // normaliza espaços
  const texto = textoBruto.replace(/\s+/g, " ").trim();

  const numeroPedido = texto.match(/Pedido:\s*(\S+)/i)?.[1] ?? null;

  // 1º CNPJ do documento = fornecedor (o do cabeçalho). O CNPJ do "Cliente"
  // vem depois ("CPF/CNPJ:" na seção do cliente) e é ignorado aqui.
  const fornecedorCnpj =
    texto.match(/CNPJ:\s*([\d./-]{14,18})/i)?.[1]?.trim() ?? null;

  // Razão social: preferimos a linha "Operador:" (nome completo); senão o
  // nome em caixa-alta antes do 1º "CNPJ:".
  const fornecedorNome =
    texto
      .match(/Operador:\s*(.+?)\s*(?:Vendedor|Observa|Desconto|$)/i)?.[1]
      ?.trim() ??
    texto.match(/^([A-ZÀ-Ú0-9 .&-]+?)\s+CNPJ:/)?.[1]?.trim() ??
    null;

  const emitidoEm = brDateToISO(
    texto.match(/(\d{2}\/\d{2}\/\d{4})\s+\d{2}:\d{2}/)?.[1],
  );

  // só a faixa entre o cabeçalho da tabela e o "Subtotal" (evita falsos itens)
  const corpo = (() => {
    const ini = texto.search(/Produto|Qtd|Valor Total/i);
    const fim = texto.search(/Subtotal/i);
    if (ini >= 0 && fim > ini) return texto.slice(ini, fim);
    return texto;
  })();

  const itens: PedidoItem[] = [];
  for (const m of corpo.matchAll(ITEM_RE)) {
    let valorTotal = brToNumber(m[1]);
    let valorUnitario = brToNumber(m[2]);
    const codigo = m[3];
    const descricao = m[4].trim();
    const quantidade = Number(m[5]);

    // sanity check: unit * qtd ≈ total — se ficou invertido, corrige
    if (
      quantidade > 0 &&
      Math.abs(valorUnitario * quantidade - valorTotal) >
        Math.abs(valorTotal * quantidade - valorUnitario)
    ) {
      [valorUnitario, valorTotal] = [valorTotal, valorUnitario];
    }

    itens.push({ codigo, descricao, quantidade, valorUnitario, valorTotal });
  }

  const totalDoc = texto.match(/\bTotal\s*R\$\s*([\d.]+,\d{2})/i)?.[1];
  const valorTotal = totalDoc
    ? brToNumber(totalDoc)
    : itens.reduce((s, i) => s + i.valorTotal, 0);

  return {
    numeroPedido,
    fornecedorCnpj,
    fornecedorNome,
    emitidoEm,
    itens,
    valorTotal,
  };
}
