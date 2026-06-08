-- ============================================================
-- Nova OS: tipo de serviço e tipo de imóvel
-- Rodar UMA VEZ no SQL Editor do Supabase do CRM (dedetech-crm).
-- (pragas[] e estruturas[] já existem em service_orders)
-- ============================================================

alter table public.service_orders
  add column if not exists service_id  uuid references public.services(id),
  add column if not exists tipo_imovel  text;

create index if not exists idx_service_orders_service_id
  on public.service_orders (service_id);
