-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — F9: Comunicação + Cobrança + NPS                      ║
-- ║  messages, charges, nps_responses                                 ║
-- ╚══════════════════════════════════════════════════════════════════╝

create type message_channel as enum ('whatsapp','email');
create type message_status as enum ('queued','sent','failed','skipped');
create type charge_type as enum ('boleto','pix','manual');
create type charge_status as enum ('pendente','pago','cancelado','estornado');

-- ─── LOG DE MENSAGENS (WhatsApp / e-mail) ────────────────────────────
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  canal message_channel not null,
  destino text not null,
  assunto text,
  corpo text,
  related_kind text,                 -- 'os' | 'cobranca' | 'nps' | ...
  related_id uuid,
  status message_status not null default 'queued',
  provider_message_id text,
  erro text,
  created_at timestamptz not null default now()
);
create index on public.messages (tenant_id);
create index on public.messages (related_kind, related_id);

-- ─── COBRANÇAS (Asaas / manual) ──────────────────────────────────────
create table public.charges (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  ar_id uuid references public.accounts_receivable(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  provider text not null default 'asaas',
  tipo charge_type not null default 'pix',
  status charge_status not null default 'pendente',
  valor numeric not null default 0,
  vencimento date,
  provider_charge_id text,
  invoice_url text,
  pix_payload text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.charges (tenant_id);
create index on public.charges (ar_id);
create index on public.charges (provider_charge_id);

-- ─── NPS PÓS-SERVIÇO ─────────────────────────────────────────────────
create table public.nps_responses (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  os_id uuid references public.service_orders(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  token text not null unique default encode(gen_random_bytes(16),'hex'),
  score int check (score between 0 and 10),
  comentario text,
  enviado_em timestamptz not null default now(),
  respondido_em timestamptz,
  created_at timestamptz not null default now()
);
create index on public.nps_responses (tenant_id);
create index on public.nps_responses (token);
create index on public.nps_responses (os_id);

-- ─── updated_at + auditoria + RLS ────────────────────────────────────
create trigger t_charges_upd before update on public.charges
  for each row execute function public.set_updated_at();

do $$
declare t text;
begin
  foreach t in array array['messages','charges','nps_responses'] loop
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
