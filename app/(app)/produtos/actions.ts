"use server";

import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { productSchema } from "@/lib/validators/cadastros";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "operacional"];

export async function salvarProduto(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({
    table: "products",
    schema: productSchema,
    formData,
    roles: ROLES,
    path: "/produtos",
    id,
  });
}

export async function excluirProduto(id: string) {
  await deleteRecord("products", id, ROLES, "/produtos");
}
