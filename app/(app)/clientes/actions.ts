"use server";

import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { clientSchema, clientUnitSchema } from "@/lib/validators/cadastros";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "comercial", "operacional"];

export async function salvarCliente(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "clients",
    schema: clientSchema,
    formData,
    roles: ROLES,
    path: "/clientes",
    id,
  });
}

export async function excluirCliente(id: string) {
  await deleteRecord("clients", id, ROLES, "/clientes");
}

// ─── Unidades ────────────────────────────────────────────────────────
export async function salvarUnidade(
  clientId: string,
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  // injeta o client_id (não vem do form)
  formData.set("client_id", clientId);
  return saveRecord({
    table: "client_units",
    schema: clientUnitSchema,
    formData,
    roles: ROLES,
    path: `/clientes/${clientId}`,
    id,
  });
}

export async function excluirUnidade(clientId: string, id: string) {
  await deleteRecord("client_units", id, ROLES, `/clientes/${clientId}`);
}
