import { z } from "zod";

const opt = (s: z.ZodTypeAny) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), s.optional());

export const leadSchema = z.object({
  nome_contato: z.string().min(2, "Informe o nome do contato"),
  telefone: opt(z.string()),
  email: opt(z.string().email("E-mail inválido")),
  origem: z.enum(["indicacao", "google", "instagram", "site", "passagem", "outro"]),
  valor_estimado: z.coerce.number().min(0).default(0),
  client_id: z.preprocess(
    (v) => (v === "" || v == null || v === "none" ? undefined : v),
    z.string().uuid().optional(),
  ),
  descricao: opt(z.string()),
});

export const quoteItemSchema = z.object({
  kind: z.enum(["servico", "produto", "outro"]),
  service_id: z.preprocess(
    (v) => (v === "" || v == null || v === "none" ? undefined : v),
    z.string().uuid().optional(),
  ),
  product_id: z.preprocess(
    (v) => (v === "" || v == null || v === "none" ? undefined : v),
    z.string().uuid().optional(),
  ),
  descricao: z.string().min(1, "Descreva o item"),
  quantidade: z.coerce.number().positive("Quantidade inválida").default(1),
  preco_unit: z.coerce.number().min(0).default(0),
});

export const quoteSchema = z.object({
  validade: opt(z.string()),
  desconto: z.coerce.number().min(0).default(0),
  observacoes: opt(z.string()),
});

export const taskSchema = z.object({
  titulo: z.string().min(2, "Descreva a tarefa"),
  due_at: opt(z.string()),
});
