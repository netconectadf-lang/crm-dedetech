"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { appOrigin } from "@/lib/app-url";
import { type ChargeTipo } from "@/lib/asaas";
import { gerarCobrancaCore, type CobrancaResult } from "@/lib/cobranca-core";
import type { AppRole } from "@/lib/types";

export type { CobrancaResult } from "@/lib/cobranca-core";

const ROLES: AppRole[] = ["owner", "financeiro"];

/**
 * Gera uma cobrança (boleto/PIX/cartão) para uma Conta a Receber. Reusa o
 * núcleo `gerarCobrancaCore` (compartilhado com o endpoint /api/cobranca do app).
 */
export async function gerarCobranca(arId: string, tipo: ChargeTipo): Promise<CobrancaResult> {
  const ctx = await requireRole(ROLES);
  const supabase = await createClient();
  const r = await gerarCobrancaCore(supabase, ctx.tenantId, arId, tipo, await appOrigin());
  revalidatePath("/financeiro/receber");
  return r;
}
