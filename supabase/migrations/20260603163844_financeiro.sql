-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — F8: Fluxo de Caixa                                    ║
-- ║  bank_accounts, cost_centers, accounts_receivable/payable         ║
-- ╚══════════════════════════════════════════════════════════════════╝

create type finance_status as enum ('a_vencer','parcial','quitado','cancelado');
create type payment_method as enum (
  'pix','boleto','dinheiro','cartao','transferencia','outro'
);
create type recurrence as enum ('unica','mensal','anual');
create type bank_account_type as enum ('corrente','poupanca','caixa','cartao');

-- ─── CONTAS BANCÁRIAS ────────────────────────────────────────────────
create table public.bank_accounts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  tipo bank_account_type not null default 'corrente',
  banco text,
  saldo_inicial numeric not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.bank_accounts (tenant_id);

-- ─── CENTROS DE CUSTO ────────────────────────────────────────────────
create table public.cost_centers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.cost_centers (tenant_id);

-- ─── CONTAS A RECEBER ────────────────────────────────────────────────
create table public.accounts_receivable (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  os_id uuid references public.service_orders(id) on delete set null,
  contract_id uuid references public.contracts(id) on delete set null,
  descricao text not null,
  valor numeric not null default 0,
  valor_pago numeric not null default 0,
  vencimento date not null default current_date,
  forma_pagamento payment_method,
  status finance_status not null default 'a_vencer',
  bank_account_id uuid references public.bank_accounts(id) on delete set null,
  observacoes text,
  pago_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.accounts_receivable (tenant_id);
create index on public.accounts_receivable (tenant_id, status);
create index on public.accounts_receivable (tenant_id, vencimento);
create index on public.accounts_receivable (client_id);

-- ─── CONTAS A PAGAR ──────────────────────────────────────────────────
create table public.accounts_payable (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  cost_center_id uuid references public.cost_centers(id) on delete set null,
  account_id uuid references public.chart_of_accounts(id) on delete set null,
  descricao text not null,
  valor numeric not null default 0,
  valor_pago numeric not null default 0,
  vencimento date not null default current_date,
  forma_pagamento payment_method,
  recorrencia recurrence not null default 'unica',
  status finance_status not null default 'a_vencer',
  bank_account_id uuid references public.bank_accounts(id) on delete set null,
  observacoes text,
  pago_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.accounts_payable (tenant_id);
create index on public.accounts_payable (tenant_id, status);
create index on public.accounts_payable (tenant_id, vencimento);

-- ─── updated_at + auditoria + RLS ────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'bank_accounts','cost_centers','accounts_receivable','accounts_payable'
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
