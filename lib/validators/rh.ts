import { z } from "zod";

const opt = (s: z.ZodTypeAny) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), s.optional());

export const absenceSchema = z.object({
  tipo: z.enum(["ferias", "atestado", "licenca", "folga", "falta"]),
  inicio: z.string().min(1, "Informe o início"),
  fim: z.string().min(1, "Informe o fim"),
  motivo: opt(z.string()),
});

export const epiSchema = z.object({
  descricao: z.string().min(2, "Descreva o EPI"),
  entregue_em: z.string().min(1, "Informe a data de entrega"),
  validade: opt(z.string()),
  assinado: z.coerce.boolean().default(false),
});

export const examSchema = z.object({
  tipo: z.enum(["admissional", "periodico", "demissional", "retorno", "mudanca"]),
  data: z.string().min(1, "Informe a data"),
  validade: opt(z.string()),
  resultado: opt(z.string()),
});

export const trainingSchema = z.object({
  nome: z.string().min(2, "Informe o treinamento"),
  categoria: opt(z.string()),
  instituicao: opt(z.string()),
  concluido_em: opt(z.string()),
  validade: opt(z.string()),
});
