# Entitlements (Lado B do Cortex)

Faz o CRM **aplicar** os planos de assinatura: responde "este tenant pode usar
a feature X?" e "qual o limite de Y?". O hub **Cortex** é a FONTE DA VERDADE e
escreve direto no banco: `plans` (master, features no JSONB + colunas `limite_*`)
e `platform_plans` (vitrine). A assinatura do tenant está em `subscriptions`
(o Cortex lê, é READ-ONLY pra ele).

As keys de feature seguem o `.cortex/features.catalog.json`
(ex.: `os`, `funil`, `nfse`, `cobranca`, `whatsapp`, `rh`, `gps`, `portal`…)
e os limites são `limite.usuarios`, `limite.os_mes`, `limite.storage_gb`.

## Reconciliação (precedência)

`getEntitlements(tenantId?)` resolve `subscriptions → plans` (base) e
**reconcilia** com `feature_flags` (override por tenant). Para cada key:

```
efetivo[key] = feature_flags[key] ?? (assinaturaUtilizável ? plano[key] : false)
```

O **feature_flag VENCE o plano** — é a exceção manual por tenant, vale até com
assinatura cancelada. Sem flag, vale o plano, mas só se a assinatura estiver
utilizável: `active`, ou `trialing` com `current_period_end` no futuro. **Trial
vencido = pago bloqueado**; `past_due`/`canceled`/`none` também bloqueiam.
Toda essa lógica é pura em `core.ts` (`reconcileEntitlements`) e coberta por
`tests/entitlements.test.ts`. **Não** consulte `plans`/`feature_flags` fora
desta camada.

## Servidor (Server Components / Route Handlers / Server Actions)

```ts
import { getEntitlements, can, withinLimit } from "@/lib/entitlements";

const ent = await getEntitlements();

// gate de feature
if (!can(ent, "nfse")) {
  // esconder a tela, retornar 403, etc.
}

// gate de cota (ex.: antes de criar uma OS no mês)
if (!withinLimit(ent, "limite.os_mes", osCriadasNoMes)) {
  throw new Error("Limite de OS do plano atingido.");
}
```

## Cliente (render condicional)

No layout (server) resolva e injete:

```tsx
import { getEntitlements } from "@/lib/entitlements";
import { EntitlementsProvider } from "@/lib/entitlements/provider";

const ent = await getEntitlements();
return <EntitlementsProvider value={ent}>{children}</EntitlementsProvider>;
```

Em qualquer client component:

```tsx
import { Gate, useEntitlements } from "@/lib/entitlements/provider";

<Gate feature="whatsapp">
  <BotaoCampanhaWhatsApp />
</Gate>;

const { can, planName } = useEntitlements();
```

## Defesa em profundidade

`can()` na UI **esconde**; o gate no servidor (Server Action / Route Handler)
**impede**. A RLS continua sendo a rede de segurança final dos dados.
