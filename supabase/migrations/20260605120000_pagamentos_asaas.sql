-- ╔═══════════════════════════════════════════════════════════════════╗
-- ║  PAGAMENTOS — credenciais Asaas por tenant + cobrança por cartão    ║
-- ║  payment_integrations (1 por empresa), charge_type 'cartao',        ║
-- ║  clients.asaas_customer_id (sincronização de cliente no Asaas)      ║
-- ╚═══════════════════════════════════════════════════════════════════╝

-- novo método de cobrança (cartão de crédito via link de pagamento)
alter type charge_type add value if not exists 'cartao';

-- ─── Credenciais de pagamento por empresa (cada uma usa a própria conta) ───
create table if not exists public.payment_integrations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  provider text not null default 'asaas',
  -- chave de API do gateway (Asaas: access_token da própria conta da empresa)
  api_key text not null,
  -- 'sandbox' para testes, 'production' para cobrar de verdade
  environment text not null default 'sandbox' check (environment in ('sandbox', 'production')),
  -- token que o gateway envia no header do webhook (validação fail-closed)
  webhook_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  -- carteira de split/recebimento (opcional)
  wallet_id text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payint_token on public.payment_integrations (webhook_token);

create trigger t_payint_upd before update on public.payment_integrations
  for each row execute function public.set_updated_at();

-- ─── Cliente espelhado no Asaas (evita recriar customer a cada cobrança) ───
alter table public.clients add column if not exists asaas_customer_id text;

-- ─── auditoria + RLS por tenant ───
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 't_payment_integrations_audit'
  ) then
    create trigger t_payment_integrations_audit
      after insert or update or delete on public.payment_integrations
      for each row execute function public.audit_trigger();
  end if;
end $$;

alter table public.payment_integrations enable row level security;

drop policy if exists payment_integrations_tenant on public.payment_integrations;
create policy payment_integrations_tenant on public.payment_integrations
  for all using (tenant_id = current_tenant_id())
  with check (tenant_id = current_tenant_id());
