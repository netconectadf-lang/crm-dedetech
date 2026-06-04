import { z } from "zod";

const opt = (s: z.ZodTypeAny) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), s.optional());

const switchBool = z.preprocess(
  (v) => v === "on" || v === "true" || v === true,
  z.boolean(),
);

/** Normaliza telefone BR para o formato 55DDDNNNNNNNN (só dígitos). */
export function normalizarTelefone(raw: string): string {
  const d = (raw ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0055")) return d.slice(2);
  if (d.startsWith("00")) return "55" + d.slice(2);
  if (d.startsWith("55") && d.length >= 12) return d;
  if (d.length === 10 || d.length === 11) return "55" + d;
  return d;
}

const telefone = z
  .string()
  .trim()
  .transform((v) => normalizarTelefone(v))
  .refine((v) => v.length >= 12 && v.length <= 13, "Telefone inválido");

// ─── Contato ─────────────────────────────────────────────────────────
export const contatoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome"),
  telefone,
  variavel_1: opt(z.string().trim()),
  variavel_2: opt(z.string().trim()),
  variavel_3: opt(z.string().trim()),
  notas: opt(z.string().trim()),
});

// ─── Script / Template ───────────────────────────────────────────────
export const scriptSchema = z.object({
  nome: z.string().trim().min(2, "Dê um nome ao script"),
  corpo: z.string().trim().min(3, "Escreva a mensagem"),
  ativo: switchBool.default(true),
});

// ─── Campanha ────────────────────────────────────────────────────────
export const campanhaSchema = z.object({
  nome: z.string().trim().min(2, "Dê um nome à campanha"),
  script_id: z.string().uuid("Selecione um script"),
  intervalo_segundos: z.preprocess(
    (v) => (v === "" || v == null ? 5 : Number(v)),
    z.number().int().min(2, "Mínimo 2s").max(120, "Máximo 120s"),
  ),
});
