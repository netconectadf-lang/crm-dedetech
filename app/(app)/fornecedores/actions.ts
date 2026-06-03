"use server";

import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { supplierSchema } from "@/lib/validators/cadastros";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "operacional", "financeiro"];

export async function salvarFornecedor(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "suppliers",
    schema: supplierSchema,
    formData,
    roles: ROLES,
    path: "/fornecedores",
    id,
  });
}

export async function excluirFornecedor(id: string) {
  await deleteRecord("suppliers", id, ROLES, "/fornecedores");
}
