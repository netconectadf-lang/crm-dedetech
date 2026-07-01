import { z } from "zod";
import { switchBool } from "./cadastros";

/** Opções financeiras da confirmação do pedido. */
export const confirmarPedidoSchema = z.object({
  parcelas: z.coerce.number().int().min(1, "Mínimo 1").max(36, "Máximo 36"),
  primeiro_vencimento: z.string().min(8, "Informe o 1º vencimento"),
  intervalo_dias: z.coerce.number().int().min(0).max(180).default(30),
  atualizar_custo: switchBool.default(true),
  /** JSON: [{ id, value }] — value = uuid do produto ou "novo". */
  itens: z.string().min(2),
});

export const itemMapSchema = z.array(
  z.object({ id: z.string().uuid(), value: z.string().min(1) }),
);
