"use server";

import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { serviceSchema } from "@/lib/validators/cadastros";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "comercial", "operacional"];

export async function salvarServico(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "services",
    schema: serviceSchema,
    formData,
    roles: ROLES,
    path: "/servicos",
    id,
  });
}

export async function excluirServico(id: string) {
  await deleteRecord("services", id, ROLES, "/servicos");
}
