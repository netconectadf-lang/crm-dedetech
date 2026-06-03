import { requireTenant } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const ctx = await requireTenant();
  const primeiroNome = ctx.fullName?.split(" ")[0] ?? "bem-vindo";

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {primeiroNome} 👋</h1>
        <p className="text-sm text-muted-foreground">
          Você está como <strong>{ROLE_LABELS[ctx.role]}</strong>. Os módulos de
          gestão entram nas próximas fases.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Funil comercial", fase: "Fase 3" },
          { label: "Contratos recorrentes", fase: "Fase 4" },
          { label: "Ordens de serviço", fase: "Fase 6" },
          { label: "Financeiro", fase: "Fase 8" },
        ].map((m) => (
          <Card key={m.label} className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">{m.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-muted-foreground">
                Em breve · {m.fase}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
