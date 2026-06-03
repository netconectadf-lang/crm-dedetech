-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — F11: Portal do Cliente                                ║
-- ║  client_portal_users (vínculo) + client_requests (chamados)       ║
-- ╚══════════════════════════════════════════════════════════════════╝

create type request_type as enum ('visita_extra','duvida','reclamacao','outro');
create type request_status as enum ('aberto','em_andamento','resolvido');

-- ─── VÍNCULO usuário (cliente) <-> client ────────────────────────────
-- Um usuário do portal NÃO tem membership (logo, sem acesso amplo via RLS).
-- O portal lê os dados via admin client escopado pelo client_id deste vínculo.
create table public.client_portal_users (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id)
);
create index on public.client_portal_users (tenant_id);
create index on public.client_portal_users (client_id);

-- client_id do usuário logado (para policies futuras de cliente)
create or replace function public.current_client_id()
returns uuid language sql stable as $$
  select client_id from public.client_portal_users where user_id = auth.uid() limit 1;
$$;

-- ─── CHAMADOS / SOLICITAÇÕES ─────────────────────────────────────────
create table public.client_requests (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  tipo request_type not null default 'duvida',
  mensagem text not null,
  status request_status not null default 'aberto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.client_requests (tenant_id);
create index on public.client_requests (client_id);

-- ─── RLS ─────────────────────────────────────────────────────────────
alter table public.client_portal_users enable row level security;
-- staff (membros) gerenciam os vínculos da empresa; o próprio usuário lê o seu
create policy cpu_tenant on public.client_portal_users for all
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());
create policy cpu_self on public.client_portal_users for select
  using (user_id = auth.uid());

alter table public.client_requests enable row level security;
create policy creq_tenant on public.client_requests for all
  using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());

-- updated_at + auditoria
create trigger t_client_requests_upd before update on public.client_requests
  for each row execute function public.set_updated_at();
create trigger t_client_portal_users_audit after insert or update or delete on public.client_portal_users
  for each row execute function public.audit_trigger();
create trigger t_client_requests_audit after insert or update or delete on public.client_requests
  for each row execute function public.audit_trigger();
