import { z } from "zod";
import { switchBool } from "./cadastros";

const opt = (s: z.ZodTypeAny) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), s.optional());

const uuidOpt = z.preprocess(
  (v) => (v === "" || v == null || v === "none" ? undefined : v),
  z.string().uuid().optional(),
);

const formaOpt = z.preprocess(
  (v) => (v === "" || v == null || v === "none" ? undefined : v),
  z.enum(["pix", "boleto", "dinheiro", "cartao", "transferencia", "outro"]).optional(),
);

export const receivableSchema = z.object({
  client_id: uuidOpt,
  descricao: z.string().min(2, "Informe a descrição"),
  valor: z.coerce.number().min(0).default(0),
  vencimento: z.string().min(1, "Informe o vencimento"),
  forma_pagamento: formaOpt,
  observacoes: opt(z.string()),
});

export const payableSchema = z.object({
  supplier_id: uuidOpt,
  cost_center_id: uuidOpt,
  descricao: z.string().min(2, "Informe a descrição"),
  valor: z.coerce.number().min(0).default(0),
  vencimento: z.string().min(1, "Informe o vencimento"),
  forma_pagamento: formaOpt,
  recorrencia: z.enum(["unica", "mensal", "anual"]),
  observacoes: opt(z.string()),
});

export const bankAccountSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  tipo: z.enum(["corrente", "poupanca", "caixa", "cartao"]),
  banco: opt(z.string()),
  saldo_inicial: z.coerce.number().default(0),
  ativo: switchBool.default(true),
});

export const costCenterSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  ativo: switchBool.default(true),
});

export const baixaSchema = z.object({
  valor: z.coerce.number().positive("Valor inválido"),
  bank_account_id: uuidOpt,
});
