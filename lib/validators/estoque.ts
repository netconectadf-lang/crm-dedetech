import { z } from "zod";

const opt = (s: z.ZodTypeAny) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), s.optional());

/** Igual ao opt, mas vazio vira null (p/ LIMPAR o campo no update). */
const optNull = (s: z.ZodTypeAny) =>
  z.preprocess((v) => (v === "" || v == null ? null : v), s.nullable());

/** Edição dos metadados do lote (não mexe na quantidade — isso é via movimento). */
export const loteEditSchema = z.object({
  lote: optNull(z.string()),
  validade: optNull(z.string()),
  fabricante: optNull(z.string()),
  nf_entrada: optNull(z.string()),
  data_entrada: optNull(z.string()),
});

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
