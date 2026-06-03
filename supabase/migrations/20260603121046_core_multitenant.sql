-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — F1: Núcleo multi-tenant                                ║
-- ║  Tabelas de plataforma + RLS + hook de JWT + auditoria + LGPD      ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ─── 1. Extensões ────────────────────────────────────────────────────
create extension if not exists pg_trgm;
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ─── 2. Enums ────────────────────────────────────────────────────────
create type app_role as enum ('owner','financeiro','comercial','operacional','rh','tecnico','cliente');
create type tenant_status as enum ('trial','active','suspended','canceled');
create type invitation_status as enum ('pending','accepted','revoked','expired');
create type subscription_status as enum ('trialing','active','past_due','canceled');
create type lgpd_request_type as enum ('access','portability','erasure','rectification');
create type lgpd_request_status as enum ('open','in_progress','done','rejected');

-- ─── 3. Helpers ──────────────────────────────────────────────────────

-- empresa ativa do usuário (claim do JWT)
create or replace function public.current_tenant_id()
returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'tenant_id','')::uuid;
$$;

-- papel do usuário na empresa ativa (claim do JWT)
create or replace function public.current_user_role()
returns app_role language sql stable as $$
  select nullif(auth.jwt() ->> 'user_role','')::app_role;
$$;

-- checagem de papel para policies / server actions
create or replace function public.has_role(roles app_role[])
returns boolean language sql stable as $$
  select public.current_user_role() = any(roles);
$$;

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ─── 4. Tabelas de plataforma ────────────────────────────────────────

-- EMPRESAS (tenants)
create table public.tenants (
  id uuid primary key default uuid_generate_v4(),
  razao_social text not null,
  nome_fantasia text,
  cnpj text unique,
  status tenant_status not null default 'trial',
  -- branding do mini-site / PDFs
  logo_url text,
  cor_primaria text default '#0F766E',
  subdominio text unique,            -- empresa.dedetech.com.br
  dominio_proprio text unique,
  -- dados fiscais (NFSe - Fase 10)
  inscricao_municipal text,
  registro_vigilancia_sanitaria text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PERFIS (espelha auth.users 1:1)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  active_tenant_id uuid references public.tenants(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- VÍNCULOS usuário <-> empresa <-> papel
create table public.memberships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role app_role not null default 'operacional',
  created_at timestamptz not null default now(),
  unique (user_id, tenant_id)
);
create index on public.memberships (tenant_id);
create index on public.memberships (user_id);

-- CONVITES
create table public.invitations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role app_role not null default 'operacional',
  token text not null unique default encode(gen_random_bytes(24),'hex'),
  status invitation_status not null default 'pending',
  invited_by uuid references auth.users(id),
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);
create index on public.invitations (tenant_id);
create index on public.invitations (token);

-- PLANOS do SaaS + ASSINATURA da PLATAFORMA (separado do financeiro do tenant)
create table public.plans (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  preco_mensal_cents int not null default 0,
  limite_usuarios int, limite_os_mes int, limite_storage_gb int,
  features jsonb not null default '{}'::jsonb,
  ativo boolean not null default true
);
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status subscription_status not null default 'trialing',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id)
);

-- FEATURE FLAGS por empresa
create table public.feature_flags (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  key text not null,
  enabled boolean not null default false,
  unique (tenant_id, key)
);

-- AUDITORIA (append-only)
create table public.audit_log (
  id bigint generated by default as identity primary key,
  tenant_id uuid,
  user_id uuid,
  action text not null,            -- INSERT/UPDATE/DELETE/ACCESS
  entity text not null,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  ip inet,
  created_at timestamptz not null default now()
);
create index on public.audit_log (tenant_id, created_at desc);

-- LGPD: consentimentos + solicitações do titular
create table public.lgpd_consents (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  titular_tipo text not null,      -- 'cliente' | 'funcionario'
  titular_id uuid not null,
  base_legal text not null,        -- consentimento, contrato, obrigacao legal...
  finalidade text not null,
  versao_termo text,
  consentido_em timestamptz not null default now()
);
create table public.lgpd_requests (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  tipo lgpd_request_type not null,
  status lgpd_request_status not null default 'open',
  titular_email text not null,
  detalhe text,
  created_at timestamptz not null default now()
);

-- updated_at triggers
create trigger t_tenants_upd before update on public.tenants for each row execute function public.set_updated_at();
create trigger t_profiles_upd before update on public.profiles for each row execute function public.set_updated_at();

-- ─── 5. Espelho automático de auth.users -> profiles ─────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 6. Custom Access Token Hook (injeta tenant_id + role no JWT) ─────
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable as $$
declare
  claims jsonb := event->'claims';
  v_uid uuid := (event->>'user_id')::uuid;
  v_tenant uuid;
  v_role app_role;
begin
  select active_tenant_id into v_tenant from public.profiles where id = v_uid;
  if v_tenant is null then
    select tenant_id into v_tenant from public.memberships
      where user_id = v_uid order by created_at limit 1;
  end if;
  if v_tenant is not null then
    select role into v_role from public.memberships
      where user_id = v_uid and tenant_id = v_tenant;
  end if;

  claims := jsonb_set(claims, '{tenant_id}', coalesce(to_jsonb(v_tenant::text),'null'::jsonb));
  claims := jsonb_set(claims, '{user_role}', coalesce(to_jsonb(v_role::text),'null'::jsonb));
  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- permissões do hook (roda como supabase_auth_admin)
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant select on public.profiles, public.memberships to supabase_auth_admin;

-- ─── 7. Provisionamento de empresa (signup -> tenant + owner) ────────
create or replace function public.provision_tenant(p_razao_social text, p_cnpj text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_tenant uuid; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'não autenticado'; end if;
  insert into public.tenants(razao_social, cnpj) values (p_razao_social, p_cnpj)
    returning id into v_tenant;
  insert into public.memberships(user_id, tenant_id, role) values (v_uid, v_tenant, 'owner');
  update public.profiles set active_tenant_id = v_tenant where id = v_uid;
  -- assinatura trial no plano padrão (se houver)
  insert into public.subscriptions(tenant_id, plan_id, status)
    select v_tenant, id, 'trialing' from public.plans where ativo order by preco_mensal_cents limit 1;
  return v_tenant;
end;
$$;

-- aceitar convite (cria membership e adota a empresa como ativa)
create or replace function public.accept_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_inv public.invitations; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'não autenticado'; end if;
  select * into v_inv from public.invitations
    where token = p_token and status = 'pending' and expires_at > now();
  if not found then raise exception 'convite inválido ou expirado'; end if;

  insert into public.memberships(user_id, tenant_id, role)
    values (v_uid, v_inv.tenant_id, v_inv.role)
    on conflict (user_id, tenant_id) do update set role = excluded.role;
  update public.invitations set status = 'accepted' where id = v_inv.id;
  update public.profiles set active_tenant_id = v_inv.tenant_id where id = v_uid;
  return v_inv.tenant_id;
end;
$$;

-- ─── 8. Trigger genérico de auditoria ────────────────────────────────
create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_old jsonb; v_new jsonb; v_tenant uuid;
begin
  if tg_op = 'DELETE' then v_old := to_jsonb(old); v_tenant := old.tenant_id;
  elsif tg_op = 'UPDATE' then v_old := to_jsonb(old); v_new := to_jsonb(new); v_tenant := new.tenant_id;
  else v_new := to_jsonb(new); v_tenant := new.tenant_id; end if;

  insert into public.audit_log(tenant_id, user_id, action, entity, entity_id, old_values, new_values)
  values (v_tenant, auth.uid(), tg_op, tg_table_name,
          coalesce(v_new->>'id', v_old->>'id'), v_old, v_new);

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

-- ─── 9. RLS — habilitar ──────────────────────────────────────────────
alter table public.tenants        enable row level security;
alter table public.profiles       enable row level security;
alter table public.memberships    enable row level security;
alter table public.invitations    enable row level security;
alter table public.plans          enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.feature_flags  enable row level security;
alter table public.audit_log      enable row level security;
alter table public.lgpd_consents  enable row level security;
alter table public.lgpd_requests  enable row level security;

-- ─── 10. RLS — policies ──────────────────────────────────────────────

-- TENANTS: membros leem; só owner edita
create policy tenants_select on public.tenants for select
  using (id in (select tenant_id from public.memberships where user_id = auth.uid()));
create policy tenants_update on public.tenants for update
  using (id = current_tenant_id() and has_role(array['owner']::app_role[]));

-- PROFILES: usuário gerencia o próprio
create policy profiles_self on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

-- MEMBERSHIPS: leitura na empresa ativa ou próprios vínculos; owner gerencia
create policy memb_select on public.memberships for select
  using (tenant_id = current_tenant_id() or user_id = auth.uid());
create policy memb_manage on public.memberships for all
  using (tenant_id = current_tenant_id() and has_role(array['owner']::app_role[]))
  with check (tenant_id = current_tenant_id() and has_role(array['owner']::app_role[]));

-- PLANS: catálogo (leitura para qualquer autenticado)
create policy plans_read on public.plans for select to authenticated using (ativo);

-- INVITATIONS / SUBSCRIPTIONS / FLAGS / AUDIT / LGPD: isolados pela empresa ativa
create policy inv_tenant   on public.invitations   for all
  using (tenant_id = current_tenant_id() and has_role(array['owner']::app_role[]))
  with check (tenant_id = current_tenant_id() and has_role(array['owner']::app_role[]));
create policy sub_tenant   on public.subscriptions for select using (tenant_id = current_tenant_id());
create policy flags_tenant on public.feature_flags for select using (tenant_id = current_tenant_id());
create policy audit_tenant on public.audit_log     for select
  using (tenant_id = current_tenant_id() and has_role(array['owner','financeiro']::app_role[]));
create policy lgpd_c_tenant on public.lgpd_consents for all
  using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id());
create policy lgpd_r_tenant on public.lgpd_requests for all
  using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id());

-- ─── 11. Seed de planos (SaaS) ───────────────────────────────────────
insert into public.plans (nome, preco_mensal_cents, limite_usuarios, limite_os_mes, limite_storage_gb, features) values
  ('Starter',    14900, 2,    100,  5,   '{"funil":true,"os":true,"agenda":true}'),
  ('Pro',        34900, 8,    1000, 50,  '{"funil":true,"os":true,"agenda":true,"contratos":true,"estoque":true,"financeiro":true,"cobranca":true,"nfse":true,"whatsapp":true}'),
  ('Enterprise', 79900, null, null, 200, '{"funil":true,"os":true,"agenda":true,"contratos":true,"estoque":true,"financeiro":true,"cobranca":true,"nfse":true,"whatsapp":true,"mip":true,"gps":true,"rh":true,"portal":true}');
