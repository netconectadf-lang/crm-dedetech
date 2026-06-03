"use server";

import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { vehicleSchema } from "@/lib/validators/cadastros";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "operacional"];

export async function salvarVeiculo(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "vehicles",
    schema: vehicleSchema,
    formData,
    roles: ROLES,
    path: "/veiculos",
    id,
  });
}

export async function excluirVeiculo(id: string) {
  await deleteRecord("vehicles", id, ROLES, "/veiculos");
}
