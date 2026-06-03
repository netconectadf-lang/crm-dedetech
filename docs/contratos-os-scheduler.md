# Dedetech — Geração automática de OS a partir de contratos (Trigger.dev)

> Planejado, **deferido para a F6** (precisa da tabela `service_orders`, que
> não existe até lá). O modelo de agendamento já está pronto na F4: a função
> `proximasVisitas()` (`lib/contratos.ts`) calcula as datas de visita por
> periodicidade + dia de faturamento, e a tela do contrato já mostra o preview.

## O que falta (F6)

1. **Tabela `service_orders`** (Fase 6) com `contract_id`, `scheduled_at`, status.
2. **Cron Trigger.dev** `generate-contract-os` (ex.: diário às 06:00):
   - Busca contratos `ativo` cuja `proxima_visita_em <= hoje` (ou calcula via
     `proximasVisitas`).
   - Cria a OS programada para cada um (idempotente por `contract_id` + data).
   - Atualiza `contracts.proxima_visita_em` para a próxima data.
3. **Cobrança recorrente (F9):** o mesmo ciclo dispara a cobrança Asaas.

## Esqueleto do task (colar quando a F6 existir)

```ts
// trigger/contract-os.ts
import { schedules } from "@trigger.dev/sdk/v3";
import { createAdminClient } from "@/lib/supabase/admin";
import { proximasVisitas } from "@/lib/contratos";

export const generateContractOs = schedules.task({
  id: "generate-contract-os",
  cron: "0 6 * * *",
  run: async () => {
    const db = createAdminClient();
    const { data: contratos } = await db
      .from("contracts")
      .select("id, tenant_id, vigencia_inicio, dia_faturamento, periodicidade")
      .eq("status", "ativo");
    for (const c of contratos ?? []) {
      const [proxima] = proximasVisitas(
        c.vigencia_inicio, c.dia_faturamento, c.periodicidade, 1,
      );
      // upsert OS (idempotente) em service_orders + update proxima_visita_em
    }
  },
});
```

> Observação: a F4 NÃO adiciona dependência do Trigger.dev ainda — só o modelo.
> O SDK e o `trigger.config.ts` entram na F6 junto com a tabela de OS.
