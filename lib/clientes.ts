// Palavras ignoradas ao extrair a "marca" do nome
const STOP = new Set([
  "DE", "DO", "DA", "DOS", "DAS", "E", "LTDA", "ME", "EIRELI", "SA", "S",
  "COMERCIO", "COM", "CIA", "EPP", "GRUPO",
]);

// Termos genéricos que NÃO são rede (tipo de cliente, UF, teste)
const GENERICO = new Set([
  "CONDOMINIO", "CONDOMINIOS", "COND", "RESIDENCIAL", "EDIFICIO", "ESCOLA",
  "COLEGIO", "UNIDADE", "ASSOCIACAO", "IGREJA", "SECRETARIA", "TESTE", "CASA",
  "DF", "GO", "MG", "MT", "MS", "RO", "PE", "BA", "SP", "RJ", "PR", "SC", "ES",
]);

const normaliza = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

const titulo = (s: string) =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/** Campos necessários para rotular um cliente num select. */
export type ClienteOpcao = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  documento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  logradouro: string | null;
  numero: string | null;
};

/** Colunas a buscar no Supabase para montar o rótulo. */
export const CLIENTE_OPCAO_COLS =
  "id, razao_social, nome_fantasia, documento, bairro, cidade, uf, logradouro, numero";

/**
 * Rótulo de cliente para selects — distingue homônimos (ex.: 30 unidades
 * Bluefit com a mesma razão social) por nome fantasia + bairro/cidade +
 * filial do CNPJ. Ex.: "BLUEFIT … (Taguatinga) — Águas Claras · Brasília/DF · CNPJ 0042".
 */
export function rotuloCliente(c: {
  razao_social: string;
  nome_fantasia?: string | null;
  documento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  logradouro?: string | null;
  numero?: string | null;
}): string {
  const fantasia = c.nome_fantasia?.trim();
  const base =
    fantasia && normaliza(fantasia) !== normaliza(c.razao_social)
      ? `${c.razao_social} (${fantasia})`
      : c.razao_social;

  const local = [
    c.bairro?.trim(),
    c.cidade?.trim() && c.uf?.trim()
      ? `${c.cidade.trim()}/${c.uf.trim()}`
      : c.cidade?.trim(),
  ].filter(Boolean);

  // se não tem bairro/cidade, usa o logradouro+nº como pista
  if (local.length === 0 && c.logradouro?.trim()) {
    local.push([c.logradouro.trim(), c.numero?.trim()].filter(Boolean).join(", "));
  }

  const doc = (c.documento ?? "").replace(/\D/g, "");
  const filial = doc.length === 14 ? `CNPJ ${doc.slice(8, 12)}` : null;

  const extras = [...local, filial].filter(Boolean);
  return extras.length ? `${base} — ${extras.join(" · ")}` : base;
}

/** Extrai a primeira "marca" significativa do nome do cliente (UPPER, sem acento). */
export function marcaDoNome(
  razao: string | null,
  fantasia: string | null,
): string {
  let n = normaliza(fantasia || razao || "");
  n = n.replace(/^[0-9./-]+\s*/, ""); // tira CPF/números no começo
  const toks = n.split(/[ ./]+/).filter((t) => t.length >= 2 && !STOP.has(t));
  return toks[0] ?? "";
}

/** Nome curto do cliente: só as duas primeiras palavras (ex: "BLUEFIT BRASILIA"). */
export function nomeCurto(razao: string | null | undefined): string {
  if (!razao) return "—";
  return razao.trim().split(/\s+/).slice(0, 2).join(" ") || "—";
}

/**
 * Nome de exibição do cliente: usa o nome de fantasia (que p/ Bluefit é igual
 * ao Trílogo) e cai no nome curto da razão social quando não houver fantasia.
 */
export function nomeExibicao(
  c: { nome_fantasia?: string | null; razao_social?: string | null } | null | undefined,
): string {
  if (!c) return "—";
  return c.nome_fantasia?.trim() || nomeCurto(c.razao_social);
}

/**
 * Descobre as redes (marcas que se repetem ≥ minOcorr e não são genéricas)
 * a partir de uma lista de clientes. Retorna o conjunto de marcas-rede e a
 * função para rotular cada cliente.
 */
export function descobrirRedes(
  clientes: { razao_social: string | null; nome_fantasia: string | null }[],
  minOcorr = 3,
) {
  const contagem = new Map<string, number>();
  for (const c of clientes) {
    const m = marcaDoNome(c.razao_social, c.nome_fantasia);
    if (m) contagem.set(m, (contagem.get(m) ?? 0) + 1);
  }
  const redes = new Set<string>();
  for (const [marca, n] of contagem) {
    if (n >= minOcorr && marca.length >= 3 && !GENERICO.has(marca)) redes.add(marca);
  }
  const redeDe = (razao: string | null, fantasia: string | null): string | null => {
    const m = marcaDoNome(razao, fantasia);
    return m && redes.has(m) ? titulo(m) : null;
  };
  const lista = [...redes].map(titulo).sort((a, b) => a.localeCompare(b, "pt-BR"));
  return { lista, redeDe };
}
