import { z } from "zod";

const opt = (s: z.ZodTypeAny) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), s.optional());

// ─── Pragas / Estruturas (listas selecionáveis na OS) ────────────────
const switchBool = z.preprocess(
  (v) => v === "on" || v === "true" || v === true,
  z.boolean(),
);

export const pragaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da praga"),
  ativo: switchBool.default(true),
});

export const estruturaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da estrutura"),
  ativo: switchBool.default(true),
});

const digits = z
  .string()
  .optional()
  .transform((v) => (v ? v.replace(/\D/g, "") : undefined));

const numero = z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(v)),
  z.number().optional(),
);

// ─── Cliente ─────────────────────────────────────────────────────────
export const clientSchema = z.object({
  tipo: z.enum(["PF", "PJ"]),
  documento: digits.refine(
    (v) => !v || v.length === 11 || v.length === 14,
    "CPF (11) ou CNPJ (14) inválido",
  ),
  razao_social: z.string().min(2, "Informe o nome / razão social"),
  nome_fantasia: opt(z.string()),
  inscricao_estadual: opt(z.string()),
  inscricao_municipal: opt(z.string()),
  cep: digits,
  logradouro: opt(z.string()),
  numero: opt(z.string()),
  complemento: opt(z.string()),
  bairro: opt(z.string()),
  cidade: opt(z.string()),
  uf: opt(z.string().max(2)),
  codigo_ibge: opt(z.string()),
  telefone: digits,
  email: opt(z.string().email("E-mail inválido")),
  contato_responsavel: opt(z.string()),
  data_nascimento: opt(z.string()),
  segmento: opt(z.string()),
  origem: opt(z.string()),
  observacoes: opt(z.string()),
  ativo: z.coerce.boolean().default(true),
});

// ─── Unidade / Local ─────────────────────────────────────────────────
export const clientUnitSchema = z.object({
  client_id: z.string().uuid(),
  apelido: z.string().min(1, "Informe um apelido"),
  cep: digits,
  logradouro: opt(z.string()),
  numero: opt(z.string()),
  complemento: opt(z.string()),
  bairro: opt(z.string()),
  cidade: opt(z.string()),
  uf: opt(z.string().max(2)),
  area_m2: numero,
  tipo_ambiente: opt(z.string()),
});

// ─── Serviço ─────────────────────────────────────────────────────────
export const serviceSchema = z.object({
  nome: z.string().min(2, "Informe o nome do serviço"),
  descricao: opt(z.string()),
  praga_alvo_padrao: opt(z.string()),
  metodo_padrao: opt(z.string()),
  preco_base: z.coerce.number().min(0).default(0),
  garantia_padrao_meses: z.coerce.number().int().min(0).default(0),
  unidade_cobranca: z.enum(["m2", "visita", "ponto", "hora"]),
  ativo: z.coerce.boolean().default(true),
});

// ─── Fornecedor ──────────────────────────────────────────────────────
export const supplierSchema = z.object({
  razao_social: z.string().min(2, "Informe a razão social"),
  nome_fantasia: opt(z.string()),
  cnpj: digits.refine((v) => !v || v.length === 14, "CNPJ inválido"),
  telefone: digits,
  email: opt(z.string().email("E-mail inválido")),
  cidade: opt(z.string()),
  uf: opt(z.string().max(2)),
  categoria: opt(z.string()),
  observacoes: opt(z.string()),
  ativo: z.coerce.boolean().default(true),
});

// ─── Produto / Saneante ──────────────────────────────────────────────
export const productSchema = z.object({
  nome_comercial: z.string().min(2, "Informe o nome comercial"),
  codigo_interno: opt(z.string()),
  principio_ativo: opt(z.string()),
  grupo_quimico: opt(z.string()),
  registro_anvisa: z.string().min(1, "Registro ANVISA é obrigatório p/ saneante"),
  fabricante: opt(z.string()),
  categoria: opt(z.string()),
  classe_toxicologica: opt(z.string()),
  antidoto: opt(z.string()),
  tipo: z.enum(["concentrado", "pronto_uso"]),
  unidade_medida: opt(z.string()),
  fator_diluicao: numero,
  dose_m2: numero,
  estoque_minimo: z.coerce.number().min(0).default(0),
  preco_custo: z.coerce.number().min(0).default(0),
  preco_venda: z.coerce.number().min(0).default(0),
  fornecedor_id: z.preprocess(
    (v) => (v === "" || v == null || v === "none" ? undefined : v),
    z.string().uuid().optional(),
  ),
  ativo: z.coerce.boolean().default(true),
});

// ─── Funcionário ─────────────────────────────────────────────────────
export const employeeSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  cpf: digits.refine((v) => !v || v.length === 11, "CPF inválido"),
  rg: opt(z.string()),
  nascimento: opt(z.string()),
  telefone: digits,
  email: opt(z.string().email("E-mail inválido")),
  cargo: opt(z.string()),
  departamento: opt(z.string()),
  salario: numero,
  data_admissao: opt(z.string()),
  tipo_contrato: z.enum(["clt", "pj", "estagio", "temporario"]),
  responsavel_tecnico: z.coerce.boolean().default(false),
  registro_conselho: opt(z.string()),
  vencimento_anuidade: opt(z.string()),
  ativo: z.coerce.boolean().default(true),
});

// ─── Veículo ─────────────────────────────────────────────────────────
export const vehicleSchema = z.object({
  placa: z.string().min(7, "Placa inválida").max(8),
  modelo: opt(z.string()),
  ano: numero,
  cor: opt(z.string()),
  tipo: z.enum(["carro", "moto", "van", "caminhao"]),
  renavam: opt(z.string()),
  chassi: opt(z.string()),
  id_rastreador_traccar: opt(z.string()),
  seguradora: opt(z.string()),
  vencimento_seguro: opt(z.string()),
  vencimento_ipva: opt(z.string()),
  vencimento_licenciamento: opt(z.string()),
  km_atual: numero,
  km_proxima_revisao: numero,
  ativo: z.coerce.boolean().default(true),
});

// ─── Prestadores de serviço (terceiros) ─────────────────────────────
export const prestadorSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do prestador"),
  documento: opt(z.string()),
  tipo_servico: opt(z.string()),
  telefone: opt(z.string()),
  email: opt(z.string().email("E-mail inválido")),
  cidade: opt(z.string()),
  uf: opt(z.string().max(2)),
  valor_padrao: numero,
  observacoes: opt(z.string()),
  ativo: switchBool.default(true),
});

// ─── Plano de Contas ─────────────────────────────────────────────────
export const accountSchema = z.object({
  nome: z.string().min(2, "Informe o nome da conta"),
  codigo: opt(z.string()),
  tipo: z.enum(["receita", "despesa"]),
  parent_id: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().uuid().optional(),
  ),
  ativo: z.coerce.boolean().default(true),
});
