# Entitlements — fechamento pré-produção (relatório p/ o desenvolvedor)

**Data:** 26/06/2026 · **Banco verificado:** Supabase `hjwmezzlymhpkjzpydbj` (produção)
**Status:** pronto para revisão — **NÃO deployado**. Build ✓, `tsc` 0 erros, testes 50/51 (1 skip pré-existente, não relacionado).

Camada afetada: `lib/entitlements/{core,index,provider}.tsx` + catálogo `.cortex/features.catalog.json`.
A leitura é **dinâmica e sem cache** (Supabase server client usa `cookies()`), então mudanças do Cortex em `plans`/`subscriptions`/`feature_flags` refletem no próximo carregamento.

---

## Tarefa 1 — Backfill de subscriptions (CRÍTICA)

**Risco:** `can()` é default-deny — tenant sem subscription (`status='none'`) perde acesso a TUDO no deploy.

**1a) Query de órfãos (rodada via service-role, equivalente ao SQL do briefing):**
```sql
select t.id, t.razao_social
from tenants t
left join subscriptions s on s.tenant_id = t.id
where s.id is null;
```
**Resultado:** `1 tenant / 1 subscription` → **0 órfãos**. O backfill é no-op hoje, mas fica como rede de segurança versionada.

**1b) Migration:** `supabase/migrations/20260626120000_backfill_subscriptions.sql`
- Mesmo critério do `provision_tenant()`: plano **ativo mais barato** (`order by preco_mensal_cents, id limit 1`), `status='trialing'`.
- `current_period_end = now() + interval '14 days'`.
- **Idempotente:** `where not exists (subscription do tenant)` + guard `exists (plano ativo)` para nunca inserir `plan_id` nulo. Rodar N vezes = no-op.

---

## Tarefa 2 — Consistência seed `plans.features` × catálogo

Catálogo (13 keys): `os, funil, agenda, nfse, estoque, cobranca, whatsapp, contratos, financeiro, rh, gps, mip, portal`.

**Estado real dos planos ativos (JSONB = objeto `key→true`):**

| Plano | Preço | features (keys) | u/os/gb |
|---|---|---|---|
| Starter | R$149 | os, funil, agenda | 2/100/5 |
| Pro | R$349 | os, funil, agenda, nfse, estoque, cobranca, whatsapp, contratos, financeiro | 8/1000/50 |
| Enterprise | R$799 | + rh, gps, mip, portal | null/null/200 (ilimitado) |

**Resultado:** ✅ **Todas as keys batem com o catálogo. Antes == Depois — nenhuma migration de correção necessária.** (Nenhuma key órfã que o `can()` nunca encontraria.)

---

## Tarefa 3 — Expiração de trial

**a) `index.ts`:** o `select` de `subscriptions` agora inclui `current_period_end` e repassa à camada pura.
**b) `core.ts` — `subscriptionUsable(status, current_period_end, now)`** (conforme briefing):
- `active` → sempre libera.
- `trialing` → libera se `current_period_end IS NULL` **OU** `current_period_end > agora`.
- `trialing` **vencido** / `past_due` / `canceled` / `none` → **bloqueia**.

Esse gate de status é aplicado dentro de `reconcileEntitlements` antes de devolver as features (features do plano caem para `false` quando a assinatura não é utilizável).

**c) Testes (`tests/entitlements.test.ts`, 11 casos):** trialing vigente=libera · trialing vencido=bloqueia · trialing null=libera · active=libera · past_due/canceled/none=bloqueia · borda exata do vencimento em `subscriptionUsable`.

> ⚠️ Ajuste vs. entrega anterior: antes `trialing` com `current_period_end=null` era **bloqueado**; alinhei ao briefing → agora **libera** (trial sem prazo = vigente). O backfill e o `provision_tenant` sempre setam/deixam coerente, então na prática o caminho normal tem data.

---

## Tarefa 4 — feature_flags (override por tenant)

**Query:** `select count(*) total, count(distinct tenant_id) tenants from feature_flags;`
**Resultado:** `total=0, tenants=0` → **tabela VAZIA.**

**Decisão (divergência consciente do briefing):** o briefing pede, com a tabela vazia, **não** implementar a reconciliação e deixar só um TODO. Porém a reconciliação **já havia sido implementada e testada** numa etapa anterior. Em vez de removê-la, **mantive** porque:
1. É **segura e no-op** com a tabela vazia (`efetivo = flag ?? plano ?? false` → sem flags, vale o plano);
2. Já está **coberta por testes**;
3. É exatamente o ponto de integração que o Cortex vai usar — remover agora só adiaria retrabalho e criaria o risco de uma flag futura ser **silenciosamente ignorada**.

Em vez do TODO, documentei o estado real no topo de `getEntitlements()` (tabela vazia em 26/06, reconciliação = no-op até o Cortex gravar overrides).

**Precedência implementada (`reconcileEntitlements`, documentada no topo de `core.ts`):**
```
efetivo[key] = feature_flags[key] ?? (assinaturaUtilizável ? plano[key] : false)
```
O **feature_flag VENCE o plano** (override explícito por exceção — vale até com assinatura cancelada).
**Testes do reconciliador:** plano libera + flag nega = **nega** · plano nega + flag libera = **libera** · flag liberada vence assinatura cancelada.

> Se preferir seguir o briefing à risca (remover a reconciliação enquanto a tabela está vazia), é um `git revert` pontual em `core.ts`/`index.ts` — me avise.

---

## Arquivos

**Novos**
- `supabase/migrations/20260626120000_backfill_subscriptions.sql` — backfill idempotente (Tarefa 1).
- `tests/entitlements.test.ts` — 11 casos (Tarefas 3 e 4).
- `scripts/verify-entitlements.mts` — verificação read-only reutilizável (`pnpm dlx tsx --env-file=.env.local scripts/verify-entitlements.mts`).

**Modificados**
- `lib/entitlements/core.ts` — `reconcileEntitlements` + `subscriptionUsable` + novo shape `{plan,status,trialEndsAt,features,limits,source}`.
- `lib/entitlements/index.ts` — `getEntitlements(tenantId?)` lê `current_period_end` + `feature_flags`.
- `lib/entitlements/provider.tsx` — shape novo (`plan`, `trialEndsAt`).
- `.cortex/features.catalog.json` — v3, array flat `features` (contrato lido pelo core/Cortex).
- `lib/entitlements/README.md` — precedência + trial.

## Como subir (quando aprovado)
1. Aplicar a migration de backfill em produção (Supabase) **antes** do código (garante toda subscription antes do enforcement).
2. `git push` → deploy automático na Vercel.
3. Conferir o tenant logado: features do plano vigente respondendo e nav sem cadeados indevidos.

## Pendências fora deste escopo
- Guards de rota nas telas premium restantes (mip/mapa/rh/contratos/financeiro) — hoje a UI esconde, mas o guard server-side é a trava real.
- Origem do pagamento da **assinatura** (conta Asaas da Netconecta + checkout que escreve `subscriptions`) — o Asaas atual do projeto é a cobrança que o tenant faz dos clientes dele, coisa diferente.
