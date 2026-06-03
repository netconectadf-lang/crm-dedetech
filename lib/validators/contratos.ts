import { z } from "zod";

const opt = (s: z.ZodTypeAny) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), s.optional());

const uuidOpt = z.preprocess(
  (v) => (v === "" || v == null || v === "none" ? undefined : v),
  z.string().uuid().optional(),
);

export const contractSchema = z.object({
  client_id: z.string().uuid("Selecione o cliente"),
  titulo: z.string().min(2, "Informe um título"),
  periodicidade: z.enum(["mensal", "bimestral", "trimestral", "semestral", "anual"]),
  valor: z.coerce.number().min(0).default(0),
  vigencia_inicio: z.string().min(1, "Informe o início da vigência"),
  vigencia_fim: opt(z.string()),
  indice_reajuste: z.enum(["nenhum", "igpm", "ipca"]),
  dia_faturamento: z.coerce.number().int().min(1).max(28).default(5),
  observacoes: opt(z.string()),
});

export const contractItemSchema = z.object({
  service_id: uuidOpt,
  unit_id: uuidOpt,
  descricao: z.string().min(1, "Descreva o item"),
  quantidade: z.coerce.number().positive().default(1),
  valor: z.coerce.number().min(0).default(0),
});

export const amendmentSchema = z.object({
  data: z.string().min(1, "Informe a data"),
  descricao: z.string().min(2, "Descreva o aditivo"),
  valor_novo: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(0).optional(),
  ),
});
