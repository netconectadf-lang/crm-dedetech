"use server";

import { saveRecord, deleteRecord, type SaveState } from "@/lib/crud-helpers";
import { scriptSchema } from "@/lib/validators/whatsapp";
import type { AppRole } from "@/lib/types";

const ROLES: AppRole[] = ["owner", "comercial", "financeiro"];
const PATH = "/whatsapp/scripts";

export async function salvarScript(
  id: string | null,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  return saveRecord({ table: "wa_scripts", schema: scriptSchema, formData, roles: ROLES, path: PATH, id });
}

export async function excluirScript(id: string): Promise<void> {
  await deleteRecord("wa_scripts", id, ROLES, PATH);
}
