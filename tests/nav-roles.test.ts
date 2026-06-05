import { describe, it, expect } from "vitest";
import { visibleSections } from "@/lib/navigation";
import type { AppRole } from "@/lib/types";

function menu(role: AppRole) {
  return visibleSections(role).map((s) => ({
    secao: s.titulo ?? "Dashboard",
    itens: s.itens.map((i) => i.label),
  }));
}
const labels = (role: AppRole) => menu(role).flatMap((s) => s.itens);

describe("perfis de acesso no menu", () => {
  it("FINANCEIRO: finanças + cadastros de finanças, sem operacionais/integrações", () => {
    const m = menu("financeiro");
    console.log("\n=== FINANCEIRO ===\n" + JSON.stringify(m, null, 2));
    const l = labels("financeiro");
    // vê
    for (const x of ["Visão geral", "A receber", "A pagar", "Notas fiscais", "Clientes", "Fornecedores", "Plano de Contas", "Funil", "Ordens de serviço"])
      expect(l, `deveria ver ${x}`).toContain(x);
    // NÃO vê
    for (const x of ["Integrações", "Produtos", "Pragas", "Estruturas", "Serviços", "Funcionários", "Veículos", "Configurações", "Equipe", "Recursos Humanos"])
      expect(l, `NÃO deveria ver ${x}`).not.toContain(x);
  });

  it("TECNICO: só Dashboard + Operação (OS/MIP/Mapa)", () => {
    const m = menu("tecnico");
    console.log("\n=== TECNICO ===\n" + JSON.stringify(m, null, 2));
    const l = labels("tecnico");
    for (const x of ["Dashboard", "Ordens de serviço", "MIP / Monitoramento", "Mapa da operação"])
      expect(l, `deveria ver ${x}`).toContain(x);
    // NÃO vê cadastro / financeiro / integrações
    for (const x of ["Clientes", "Produtos", "Visão geral", "A receber", "Integrações", "Configurações", "Funil", "Campanhas"])
      expect(l, `NÃO deveria ver ${x}`).not.toContain(x);
  });

  it("MASTER (owner): vê tudo", () => {
    const l = labels("owner");
    for (const x of ["Integrações", "Configurações", "Produtos", "Visão geral", "Recursos Humanos", "Ordens de serviço"])
      expect(l).toContain(x);
  });
});
