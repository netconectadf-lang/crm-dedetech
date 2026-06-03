import { z } from "zod";

const opt = (s: z.ZodTypeAny) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), s.optional());

export const entradaSchema = z.object({
  product_id: z.string().uuid("Selecione o produto"),
  lote: opt(z.string()),
  validade: opt(z.string()),
  fabricante: opt(z.string()),
  nf_entrada: opt(z.string()),
  qtd_entrada: z.coerce.number().positive("Quantidade inválida"),
});

export const saidaSchema = z.object({
  product_id: z.string().uuid("Selecione o produto"),
  quantidade: z.coerce.number().positive("Quantidade inválida"),
  motivo: opt(z.string()),
});

export const perdaSchema = z.object({
  quantidade: z.coerce.number().positive("Quantidade inválida"),
  motivo: z.string().min(2, "Informe o motivo"),
});

export const ajusteSchema = z.object({
  contado: z.coerce.number().min(0, "Quantidade inválida"),
  motivo: opt(z.string()),
});
