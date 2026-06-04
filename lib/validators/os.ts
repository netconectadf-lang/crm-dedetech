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

/** Aceita JSON array (novo multi-select) ou texto separado por vírgula (legado). */
const listaNomes = z.preprocess((v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    const s = v.trim();
    if (s.startsWith("[")) {
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) return arr.map(String);
      } catch {
        /* cai no split por vírgula */
      }
    }
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return [];
}, z.array(z.string()));

export const fichaSchema = z.object({
  pragas: listaNomes,
  estruturas: listaNomes,
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
  km_rodado: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(0).optional(),
  ),
  tempo_execucao_min: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(0).optional(),
  ),
  observacoes: opt(z.string()),
  recomendacoes: opt(z.string()),
});

export const osProductSchema = z.object({
  product_id: z.string().uuid("Selecione o produto"),
  quantidade: z.coerce.number().positive("Quantidade inválida"),
  diluicao: opt(z.string()),
});
