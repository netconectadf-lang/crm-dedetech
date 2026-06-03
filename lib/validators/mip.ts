import { z } from "zod";

const opt = (s: z.ZodTypeAny) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), s.optional());

export const deviceSchema = z.object({
  unit_id: z.string().uuid("Selecione a unidade"),
  tipo: z.enum([
    "porta_isca",
    "armadilha_luminosa",
    "estacao_monitoramento",
    "armadilha_roedor",
    "outro",
  ]),
  numero: z.string().min(1, "Informe o número/identificação"),
  ativo: z.coerce.boolean().default(true),
});

export const readingSchema = z.object({
  consumo_pct: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(0).max(100).optional(),
  ),
  captura: z.coerce.number().int().min(0).default(0),
  status: z.enum([
    "sem_atividade",
    "consumo_baixo",
    "consumo_alto",
    "captura",
    "danificado",
    "reposto",
  ]),
  observacao: opt(z.string()),
});
