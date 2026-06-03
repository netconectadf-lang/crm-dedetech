-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — Plataforma/Site: planos públicos + leads de marketing  ║
-- ║  Tabelas NÃO multi-tenant: alimentam a vitrine (dedetech.com.br).  ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ─── 1. Planos públicos (fonte única de preços da vitrine) ───────────
create table if not exists public.platform_plans (
  id             uuid primary key default uuid_generate_v4(),
  slug           text not null unique,
  nome           text not null,
  preco_centavos integer not null,
  periodo        text not null default '/mês',
  publico_alvo   text,
  descricao      text,
  features       jsonb not null default '[]'::jsonb,
  destaque       boolean not null default false,
  cta_label      text not null default 'Começar',
  cta_tipo       text not null default 'signup',   -- 'signup' | 'whatsapp'
  ordem          integer not null default 0,
  ativo          boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger t_platform_plans_upd before update on public.platform_plans
  for each row execute function public.set_updated_at();

alter table public.platform_plans enable row level security;

-- Leitura pública (anon + authenticated) apenas dos planos ativos.
create policy platform_plans_public_read on public.platform_plans
  for select using (ativo = true);

-- ─── 2. Leads de marketing (contato/demo vindos da vitrine) ──────────
create table if not exists public.platform_leads (
  id               uuid primary key default uuid_generate_v4(),
  nome             text not null,
  email            text not null,
  telefone         text,
  empresa          text,
  mensagem         text,
  plano_interesse  text,
  origem           text not null default 'site',
  status           text not null default 'novo',   -- novo | contatado | qualificado | descartado | convertido
  meta             jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists platform_leads_created_idx on public.platform_leads (created_at desc);
create index if not exists platform_leads_status_idx  on public.platform_leads (status);

-- RLS ligada e SEM policies => ninguém (anon/authenticated) lê ou escreve.
-- A ingestão e a leitura ocorrem só pela service role (route handlers no servidor),
-- que faz bypass de RLS.
alter table public.platform_leads enable row level security;

-- ─── 3. Seed dos 3 planos atuais da vitrine ──────────────────────────
insert into public.platform_plans
  (slug, nome, preco_centavos, periodo, publico_alvo, features, destaque, cta_label, cta_tipo, ordem)
values
  ('starter', 'Starter', 14900, '/mês', 'Autônomo ou empresa começando',
   jsonb_build_array('Até 2 usuários','Cadastros e clientes','Ordens de serviço no celular','Agenda e funil','Site profissional incluso'),
   false, 'Começar', 'signup', 1),
  ('pro', 'Pro', 34900, '/mês', 'Pequena e média dedetizadora',
   jsonb_build_array('Até 8 usuários','Tudo do Starter','Contratos recorrentes','Estoque ANVISA + financeiro','Cobrança automática (Asaas)','Nota fiscal (NFSe)','WhatsApp automatizado'),
   true, 'Testar o Pro', 'signup', 2),
  ('enterprise', 'Enterprise', 79900, '/mês', 'Operação com frota e contratos corporativos',
   jsonb_build_array('Usuários ilimitados','Tudo do Pro','MIP e monitoramento','GPS da frota','Portal do cliente','RH e ponto','Suporte prioritário'),
   false, 'Falar com vendas', 'whatsapp', 3)
on conflict (slug) do nothing;
