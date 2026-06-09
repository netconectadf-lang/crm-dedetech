-- Roteirização: ordem da visita dentro da rota do dia (por técnico).
-- Preenchido ao "otimizar rota"; usado para ordenar as visitas e montar o
-- link do Google Maps na sequência correta.
alter table public.service_orders
  add column if not exists rota_seq integer;

create index if not exists idx_so_rota
  on public.service_orders (tenant_id, tecnico_id, scheduled_at, rota_seq);
