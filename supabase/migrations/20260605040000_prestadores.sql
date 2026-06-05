-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — Prestadores de serviço (terceiros)                    ║
-- ║  Empresas/autônomos contratados (dedetização terceirizada,        ║
-- ║  transporte, manutenção, etc.). tenant_id + RLS + auditoria.      ║
-- ╚══════════════════════════════════════════════════════════════════╝

create table if not exists public.service_providers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  documento text,                       -- CPF ou CNPJ
  tipo_servico text,                    -- ex.: dedetização terceirizada, transporte
  telefone text,
  email text,
  cidade text,
  uf text,
  valor_padrao numeric,                 -- valor de referência do serviço
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_service_providers_tenant on public.service_providers (tenant_id);

-- updated_at + auditoria + RLS (mesmos helpers do projeto)
create trigger t_service_providers_upd before update on public.service_providers
  for each row execute function public.set_updated_at();

create trigger t_service_providers_audit
  after insert or update or delete on public.service_providers
  for each row execute function public.audit_trigger();

alter table public.service_providers enable row level security;

create policy service_providers_tenant on public.service_providers for all
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());
