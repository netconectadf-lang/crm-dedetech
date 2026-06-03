import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

function csvField(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  await requireRole(["owner", "rh"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("employees")
    .select("nome, cpf, cargo, departamento, salario, tipo_contrato, data_admissao")
    .eq("ativo", true)
    .order("nome");

  const rows = (data as Record<string, unknown>[] | null) ?? [];
  const header = ["Nome", "CPF", "Cargo", "Departamento", "Salário", "Contrato", "Admissão"];
  const lines = [
    header.join(";"),
    ...rows.map((r) =>
      [r.nome, r.cpf, r.cargo, r.departamento, r.salario, r.tipo_contrato, r.data_admissao]
        .map(csvField)
        .join(";"),
    ),
  ];
  const csv = "﻿" + lines.join("\n"); // BOM p/ Excel pt-BR

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="folha-dedetech.csv"',
    },
  });
}
