-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — F7: MIP / Monitoramento de Pragas                     ║
-- ║  mip_devices + mip_readings                                       ║
-- ╚══════════════════════════════════════════════════════════════════╝

create type mip_device_type as enum (
  'porta_isca','armadilha_luminosa','estacao_monitoramento','armadilha_roedor','outro'
);
create type mip_reading_status as enum (
  'sem_atividade','consumo_baixo','consumo_alto','captura','danificado','reposto'
);

-- ─── DISPOSITIVOS (pontos de monitoramento) ──────────────────────────
create table public.mip_devices (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  unit_id uuid not null references public.client_units(id) on delete cascade,
  tipo mip_device_type not null default 'porta_isca',
  numero text not null,
  qr_token text not null unique default encode(gen_random_bytes(10),'hex'),
  pos_x numeric, pos_y numeric,        -- posição no croqui (camada futura)
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.mip_devices (tenant_id);
create index on public.mip_devices (unit_id);
create index on public.mip_devices (qr_token);

-- ─── LEITURAS (por visita) ───────────────────────────────────────────
create table public.mip_readings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  device_id uuid not null references public.mip_devices(id) on delete cascade,
  os_id uuid references public.service_orders(id) on delete set null,
  consumo_pct numeric,                 -- % de consumo da isca
  captura int not null default 0,      -- nº de capturas
  status mip_reading_status not null default 'sem_atividade',
  observacao text,
  lida_em timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.mip_readings (tenant_id);
create index on public.mip_readings (device_id, lida_em desc);

-- ─── updated_at + auditoria + RLS ────────────────────────────────────
create trigger t_mip_devices_upd before update on public.mip_devices
  for each row execute function public.set_updated_at();

do $$
declare t text;
begin
  foreach t in array array['mip_devices','mip_readings'] loop
    execute format(
      'create trigger t_%1$s_audit after insert or update or delete on public.%1$s
         for each row execute function public.audit_trigger();', t);
    execute format('alter table public.%1$s enable row level security;', t);
    execute format(
      'create policy %1$s_tenant on public.%1$s for all
         using (tenant_id = current_tenant_id())
         with check (tenant_id = current_tenant_id());', t);
  end loop;
end $$;
