"use server";

import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { accountSchema } from "@/lib/validators/cadastros";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "financeiro"];

export async function salvarConta(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "chart_of_accounts",
    schema: accountSchema,
    formData,
    roles: ROLES,
    path: "/plano-de-contas",
    id,
  });
}

export async function excluirConta(id: string) {
  await deleteRecord("chart_of_accounts", id, ROLES, "/plano-de-contas");
}
