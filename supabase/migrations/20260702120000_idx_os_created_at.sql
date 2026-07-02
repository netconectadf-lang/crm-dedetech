-- Índice para a contagem de cota mensal de OS (osQuotaError):
--   where tenant_id = ? and created_at >= <início do mês BR>
-- As demais listas quentes já têm índices adequados (tenant_id, status/
-- vencimento/scheduled_at) + GIN trigram em clients.razao_social.
create index if not exists idx_service_orders_tenant_created
  on public.service_orders (tenant_id, created_at);
