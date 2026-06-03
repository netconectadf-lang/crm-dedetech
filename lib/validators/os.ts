import { z } from "zod";

const opt = (s: z.ZodTypeAny) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), s.optional());

const uuidOpt = z.preprocess(
  (v) => (v === "" || v == null || v === "none" ? undefined : v),
  z.string().uuid().optional(),
);

export const osSchema = z.object({
  client_id: z.string().uuid("Selecione o cliente"),
  unit_id: uuidOpt,
  tecnico_id: uuidOpt,
  vehicle_id: uuidOpt,
  scheduled_at: opt(z.string()),
});

export const fichaSchema = z.object({
  pragas: z.preprocess(
    (v) =>
      typeof v === "string"
        ? v.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    z.array(z.string()),
  ),
  metodo: z.enum([
    "pulverizacao",
    "polvilhamento",
    "gel",
    "isca",
    "atomizacao",
    "termonebulizacao",
    "injecao",
    "outro",
  ]),
  metragem_m2: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(0).optional(),
  ),
  periodo_reentrada_horas: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(0).optional(),
  ),
  garantia_meses: z.coerce.number().int().min(0).default(0),
  observacoes: opt(z.string()),
  recomendacoes: opt(z.string()),
});

export const osProductSchema = z.object({
  product_id: z.string().uuid("Selecione o produto"),
  quantidade: z.coerce.number().positive("Quantidade inválida"),
  diluicao: opt(z.string()),
});
