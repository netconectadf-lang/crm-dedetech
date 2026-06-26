# Entitlements (Lado B do Cortex)

Faz o CRM **aplicar** os planos de assinatura: responde "este tenant pode usar
a feature X?" e "qual o limite de Y?". Os planos são geridos no hub **Cortex**
e gravados na tabela `plans` (features no JSONB + colunas `limite_*`); a
assinatura do tenant está em `subscriptions`.

As keys de feature seguem o `.cortex/features.catalog.json`
(ex.: `os`, `funil`, `nfse`, `cobranca`, `whatsapp`, `rh`, `gps`, `portal`…)
e os limites são `limite.usuarios`, `limite.os_mes`, `limite.storage_gb`.

> **Aditivo e não-quebra-nada:** nada importa este módulo ainda. Adote por tela,
> aos poucos. Assinatura `past_due`/`canceled` bloqueia tudo (`can` = false).

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
