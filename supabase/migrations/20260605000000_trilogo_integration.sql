-- Integração Trílogo (Bluefit): de-para de unidades, origem/dedup nas OS e log de sync.
-- A A7 é prestadora dentro do grupo Bluefit no Trílogo; os chamados abertos lá
-- viram OS "agendada" aqui, casando a unidade pelo id da empresa no Trílogo.

-- 1) De-para: guarda o id da empresa (unidade) do Trílogo no cliente do CRM.
alter table public.clients
  add column if not exists trilogo_company_id bigint;

-- um id de unidade Trílogo só pode apontar para um cliente por empresa
create unique index if not exists uq_clients_trilogo_company
  on public.clients (tenant_id, trilogo_company_id)
  where trilogo_company_id is not null;

-- 2) Origem + referência externa na OS (para dedup e link de volta ao chamado).
alter table public.service_orders
  add column if not exists source text not null default 'manual';
alter table public.service_orders
  add column if not exists external_ref text;
alter table public.service_orders
  add column if not exists external_url text;

-- dedup: nunca cria duas OS para o mesmo chamado do Trílogo
create unique index if not exists uq_service_orders_external
  on public.service_orders (tenant_id, source, external_ref)
  where external_ref is not null;

create index if not exists idx_service_orders_source
  on public.service_orders (tenant_id, source);

-- 3) Log das execuções de sincronização (para a tela mostrar "último sync").
create table if not exists public.trilogo_sync_runs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean not null default false,
  origem text not null default 'cron',     -- 'cron' | 'manual'
  criados int not null default 0,
  pulados int not null default 0,           -- já existiam (dedup)
  sem_mapeamento int not null default 0,    -- unidade Trílogo sem cliente casado
  erros int not null default 0,
  mensagem text,
  detalhe jsonb
);

create index if not exists idx_trilogo_sync_runs_tenant
  on public.trilogo_sync_runs (tenant_id, started_at desc);

alter table public.trilogo_sync_runs enable row level security;

-- leitura escopada por empresa (owner enxerga via app; service role ignora RLS)
drop policy if exists trilogo_sync_runs_tenant on public.trilogo_sync_runs;
create policy trilogo_sync_runs_tenant on public.trilogo_sync_runs
  for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
