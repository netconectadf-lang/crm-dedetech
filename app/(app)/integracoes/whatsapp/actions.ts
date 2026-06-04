"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import {
  connectInstance,
  getConnectionState,
  logoutInstance,
  type ConnectResult,
  type WaState,
} from "@/lib/whatsapp/evolution";

/** Gera o QR Code para parear o aparelho. */
export async function gerarQrCode(): Promise<ConnectResult> {
  await requireRole(["owner"]);
  return connectInstance();
}

/** Consulta o estado da conexão (usado no polling da tela). */
export async function statusWhatsapp(): Promise<{ state: WaState }> {
  await requireRole(["owner"]);
  return { state: await getConnectionState() };
}

/** Desconecta o número do WhatsApp. */
export async function desconectarWhatsapp(): Promise<void> {
  await requireRole(["owner"]);
  await logoutInstance();
  revalidatePath("/integracoes/whatsapp");
}
