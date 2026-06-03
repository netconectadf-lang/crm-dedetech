"use server";

import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { employeeSchema } from "@/lib/validators/cadastros";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "rh"];

export async function salvarFuncionario(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "employees",
    schema: employeeSchema,
    formData,
    roles: ROLES,
    path: "/funcionarios",
    id,
  });
}

export async function excluirFuncionario(id: string) {
  await deleteRecord("employees", id, ROLES, "/funcionarios");
}
