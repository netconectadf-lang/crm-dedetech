-- Numeração de OS sequencial POR TENANT.
-- Hoje `service_orders.numero` é um identity GLOBAL da tabela → cada empresa vê
-- números com buracos (#7, #15, #32…) e isso vaza o volume de operação entre
-- tenants. Esta migration adiciona `numero_local` SEM mexer no `numero` legado
-- (não-destrutivo). Depois de aplicada, trocar a UI para exibir `numero_local`.
--
-- APLICAR VIA Management API / painel Supabase (ver [[supabase-management-api-sql]]).

-- 1) Contador por empresa.
alter table public.tenants
  add column if not exists os_proximo_numero bigint not null default 1;

-- 2) Coluna do número local (mantém o `numero` global para compat).
alter table public.service_orders
  add column if not exists numero_local bigint;

-- 3) Backfill: numera as OS existentes por tenant na ordem de criação.
with ordenadas as (
  select id,
         row_number() over (partition by tenant_id order by created_at, numero) as rn
  from public.service_orders
)
update public.service_orders so
   set numero_local = o.rn
  from ordenadas o
 where so.id = o.id and so.numero_local is null;

-- 4) Ajusta o contador de cada tenant para o próximo número livre.
update public.tenants t
   set os_proximo_numero = coalesce(
     (select max(numero_local) + 1 from public.service_orders where tenant_id = t.id), 1);

-- 5) Reserva atômica do próximo número de um tenant (igual à da NFS-e).
create or replace function public.os_reservar_numero(p_tenant uuid)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_num bigint;
begin
  update public.tenants set os_proximo_numero = os_proximo_numero + 1
    where id = p_tenant returning os_proximo_numero - 1 into v_num;
  if v_num is null then
    raise exception 'Empresa % não encontrada para reservar número de OS', p_tenant;
  end if;
  return v_num;
end; $$;

-- 6) Trigger: toda OS nova recebe numero_local do contador do seu tenant.
create or replace function public.fn_os_set_numero_local()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.numero_local is null then
    new.numero_local := public.os_reservar_numero(new.tenant_id);
  end if;
  return new;
end; $$;

drop trigger if exists trg_os_numero_local on public.service_orders;
create trigger trg_os_numero_local
  before insert on public.service_orders
  for each row execute function public.fn_os_set_numero_local();

create index if not exists idx_service_orders_tenant_numero_local
  on public.service_orders (tenant_id, numero_local);
