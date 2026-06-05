"use server";

import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { prestadorSchema } from "@/lib/validators/cadastros";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "rh"];

export async function salvarPrestador(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "service_providers",
    schema: prestadorSchema,
    formData,
    roles: ROLES,
    path: "/prestadores",
    id,
  });
}

export async function excluirPrestador(id: string) {
  await deleteRecord("service_providers", id, ROLES, "/prestadores");
}
