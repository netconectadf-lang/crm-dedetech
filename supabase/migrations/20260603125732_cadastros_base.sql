-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — F2: Cadastros Base                                     ║
-- ║  Clientes, Unidades, Serviços, Fornecedores, Produtos/Saneantes,  ║
-- ║  Funcionários, Veículos, Plano de Contas                          ║
-- ║  Toda tabela: tenant_id + RLS + updated_at + auditoria.           ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ─── Enums ───────────────────────────────────────────────────────────
create type person_type as enum ('PF','PJ');
create type service_unit as enum ('m2','visita','ponto','hora');
create type product_type as enum ('concentrado','pronto_uso');
create type contract_type as enum ('clt','pj','estagio','temporario');
create type account_type as enum ('receita','despesa');
create type vehicle_type as enum ('carro','moto','van','caminhao');

-- ─── CLIENTES ────────────────────────────────────────────────────────
create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  tipo person_type not null default 'PJ',
  documento text,                       -- CPF (11) ou CNPJ (14), só dígitos
  razao_social text not null,           -- ou nome (PF)
  nome_fantasia text,
  inscricao_estadual text,
  inscricao_municipal text,
  -- endereço
  cep text, logradouro text, numero text, complemento text,
  bairro text, cidade text, uf text, codigo_ibge text,
  -- contato
  telefone text, email text, contato_responsavel text,
  segmento text,                        -- residencial/comercial/industria/saude/condominio
  origem text,                          -- indicação/google/instagram/site/passagem
  tags text[] not null default '{}',
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.clients (tenant_id);
create index on public.clients (tenant_id, razao_social);
create index on public.clients using gin (razao_social gin_trgm_ops);

-- ─── UNIDADES / LOCAIS DE ATENDIMENTO ────────────────────────────────
create table public.client_units (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  apelido text not null,
  cep text, logradouro text, numero text, complemento text,
  bairro text, cidade text, uf text,
  area_m2 numeric,
  tipo_ambiente text,
  lat numeric, lng numeric,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.client_units (tenant_id);
create index on public.client_units (client_id);

-- ─── CATÁLOGO DE SERVIÇOS ────────────────────────────────────────────
create table public.services (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  descricao text,
  praga_alvo_padrao text,
  metodo_padrao text,
  preco_base numeric not null default 0,
  garantia_padrao_meses int not null default 0,
  unidade_cobranca service_unit not null default 'visita',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.services (tenant_id);

-- ─── FORNECEDORES ────────────────────────────────────────────────────
create table public.suppliers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cnpj text,
  razao_social text not null,
  nome_fantasia text,
  telefone text, email text,
  cidade text, uf text,
  categoria text,                       -- saneante/EPI/combustivel/servicos
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.suppliers (tenant_id);

-- ─── PRODUTOS / SANEANTES ────────────────────────────────────────────
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  codigo_interno text,
  nome_comercial text not null,
  principio_ativo text,
  grupo_quimico text,
  registro_anvisa text,                 -- obrigatório p/ saneante (validado na app)
  fabricante text,
  categoria text,                       -- inseticida/raticida/cupinicida/...
  classe_toxicologica text,
  antidoto text,                        -- primeiros socorros / antídoto
  tipo product_type not null default 'concentrado',
  unidade_medida text default 'L',
  fator_diluicao numeric,
  dose_m2 numeric,                       -- dose recomendada por m2
  estoque_minimo numeric not null default 0,
  preco_custo numeric not null default 0,
  preco_venda numeric not null default 0,
  fispq_url text,                        -- PDF no Storage (Fase 5)
  bula_url text,
  fornecedor_id uuid references public.suppliers(id) on delete set null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.products (tenant_id);
create index on public.products (fornecedor_id);

-- ─── FUNCIONÁRIOS ────────────────────────────────────────────────────
create table public.employees (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  -- vínculo opcional com usuário do sistema (técnico que loga)
  user_id uuid references auth.users(id) on delete set null,
  nome text not null,
  cpf text, rg text,
  nascimento date,
  telefone text, email text,
  cep text, logradouro text, numero text, bairro text, cidade text, uf text,
  pis text, ctps text,
  cargo text, departamento text,
  salario numeric,
  data_admissao date,
  tipo_contrato contract_type not null default 'clt',
  responsavel_tecnico boolean not null default false,
  registro_conselho text,               -- CRBio/CRQ/CRMV/CRA/CRF
  vencimento_anuidade date,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.employees (tenant_id);

-- ─── VEÍCULOS ────────────────────────────────────────────────────────
create table public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  placa text not null,
  renavam text, chassi text,
  modelo text, ano int, cor text,
  tipo vehicle_type not null default 'carro',
  id_rastreador_traccar text, imei_rastreador text,
  seguradora text,
  vencimento_seguro date, vencimento_ipva date, vencimento_licenciamento date,
  km_atual int, km_proxima_revisao int,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.vehicles (tenant_id);

-- ─── PLANO DE CONTAS (hierárquico) ───────────────────────────────────
create table public.chart_of_accounts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  parent_id uuid references public.chart_of_accounts(id) on delete cascade,
  codigo text,
  nome text not null,
  tipo account_type not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.chart_of_accounts (tenant_id);
create index on public.chart_of_accounts (parent_id);

-- ─── updated_at + auditoria + RLS (todas as tabelas acima) ───────────
do $$
declare t text;
begin
  foreach t in array array[
    'clients','client_units','services','suppliers','products',
    'employees','vehicles','chart_of_accounts'
  ] loop
    execute format(
      'create trigger t_%1$s_upd before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
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
