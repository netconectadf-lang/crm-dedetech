-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — Vínculo de prestador (terceiro) na OS                 ║
-- ║  OS terceirizada: executada por um prestador de serviço.          ║
-- ╚══════════════════════════════════════════════════════════════════╝

alter table public.service_orders
  add column if not exists prestador_id uuid
    references public.service_providers(id) on delete set null;

create index if not exists idx_service_orders_prestador
  on public.service_orders (prestador_id);
