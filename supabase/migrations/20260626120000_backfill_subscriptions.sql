-- Backfill de subscriptions (pré-requisito do enforcement de entitlements).
--
-- A camada lib/entitlements é DEFAULT-DENY: tenant sem subscription cai em
-- status 'none' e perde acesso a TODAS as features. Esta migration garante que
-- todo tenant existente tenha uma subscription antes de o enforcement entrar em
-- produção, senão clientes ativos seriam trancados pra fora no deploy.
--
-- Critério idêntico ao provision_tenant() (migration core_multitenant):
-- plano ATIVO mais barato, status 'trialing'. current_period_end = now() + 14d.
--
-- IDEMPOTENTE: só insere onde ainda não há subscription (where not exists) e só
-- se existir ao menos um plano ativo (evita plan_id nulo). Rodar N vezes = no-op.

insert into public.subscriptions (tenant_id, plan_id, status, current_period_end)
select
  t.id,
  (select p.id from public.plans p where p.ativo order by p.preco_mensal_cents, p.id limit 1),
  'trialing',
  now() + interval '14 days'
from public.tenants t
where not exists (
  select 1 from public.subscriptions s where s.tenant_id = t.id
)
and exists (
  select 1 from public.plans where ativo
);
