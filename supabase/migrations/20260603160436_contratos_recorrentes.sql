-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — F4: Contratos Recorrentes / Planos de Manutenção      ║
-- ║  contracts, contract_items, contract_amendments                   ║
-- ╚══════════════════════════════════════════════════════════════════╝

create type contract_periodicity as enum (
  'mensal','bimestral','trimestral','semestral','anual'
);
create type contract_status as enum (
  'ativo','suspenso','cancelado','encerrado'
);
create type adjustment_index as enum ('nenhum','igpm','ipca');

-- ─── CONTRATOS ───────────────────────────────────────────────────────
create table public.contracts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  -- origem opcional (orçamento aceito que virou contrato)
  origem_quote_id uuid references public.quotes(id) on delete set null,
  titulo text not null,
  periodicidade contract_periodicity not null default 'mensal',
  valor numeric not null default 0,                 -- valor por ciclo
  vigencia_inicio date not null default current_date,
  vigencia_fim date,
  indice_reajuste adjustment_index not null default 'nenhum',
  dia_faturamento int not null default 5 check (dia_faturamento between 1 and 28),
  status contract_status not null default 'ativo',
  proxima_visita_em date,                           -- mantido pelo scheduler (F6)
  observacoes text,
  motivo_cancelamento text,
  cancelado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.contracts (tenant_id);
create index on public.contracts (tenant_id, status);
create index on public.contracts (client_id);

-- ─── ITENS DO CONTRATO (serviços cobertos, por unidade) ──────────────
create table public.contract_items (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contract_id uuid not null references public.contracts(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  unit_id uuid references public.client_units(id) on delete set null,
  descricao text not null,
  quantidade numeric not null default 1,
  valor numeric not null default 0,
  created_at timestamptz not null default now()
);
create index on public.contract_items (tenant_id);
create index on public.contract_items (contract_id);

-- ─── ADITIVOS CONTRATUAIS ────────────────────────────────────────────
create table public.contract_amendments (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contract_id uuid not null references public.contracts(id) on delete cascade,
  data date not null default current_date,
  descricao text not null,
  valor_novo numeric,
  created_at timestamptz not null default now()
);
create index on public.contract_amendments (tenant_id);
create index on public.contract_amendments (contract_id);

-- ─── updated_at + auditoria + RLS ────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['contracts','contract_items','contract_amendments'] loop
    if t = 'contracts' then
      execute format(
        'create trigger t_%1$s_upd before update on public.%1$s
           for each row execute function public.set_updated_at();', t);
    end if;
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
