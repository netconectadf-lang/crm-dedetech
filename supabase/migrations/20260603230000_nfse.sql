-- ============================================================
-- Módulo NFS-e (Nota Fiscal de Serviço eletrônica)
-- Provedor: Focus NFe. Emissão manual (1 clique na cobrança/OS).
-- ============================================================

-- Config fiscal da empresa (preenchida com o contador)
alter table public.tenants
  add column if not exists nfse_inscricao_municipal text,
  add column if not exists nfse_item_lista_servico text,   -- LC 116 (dedetização ≈ 7.13)
  add column if not exists nfse_codigo_municipio text,      -- IBGE do município
  add column if not exists nfse_aliquota_iss numeric,       -- % ISS
  add column if not exists nfse_regime_tributario text,     -- '1' Simples | '2' SN excesso | '3' Normal
  add column if not exists nfse_iss_retido boolean not null default false,
  add column if not exists nfse_natureza_operacao text;     -- opcional

-- Notas emitidas
create table if not exists public.nfse (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  ar_id uuid references public.accounts_receivable(id) on delete set null,
  os_id uuid references public.service_orders(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  ref text not null,                              -- referência única enviada ao Focus NFe
  numero text,
  codigo_verificacao text,
  status text not null default 'processando',     -- processando | autorizada | cancelada | erro
  valor_servicos numeric not null default 0,
  discriminacao text,
  pdf_url text,
  xml_url text,
  mensagem text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_nfse_tenant on public.nfse (tenant_id);
create index if not exists idx_nfse_ref on public.nfse (ref);
create index if not exists idx_nfse_ar on public.nfse (ar_id);
create index if not exists idx_nfse_os on public.nfse (os_id);

create trigger t_nfse_upd before update on public.nfse
  for each row execute function public.set_updated_at();

do $$
begin
  execute 'create trigger t_nfse_audit after insert or update or delete on public.nfse
             for each row execute function public.audit_trigger()';
  execute 'alter table public.nfse enable row level security';
  execute 'create policy nfse_tenant on public.nfse for all
             using (tenant_id = current_tenant_id())
             with check (tenant_id = current_tenant_id())';
end $$;
