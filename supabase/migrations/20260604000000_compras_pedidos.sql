-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — Compras: Pedidos de fornecedor                        ║
-- ║  Importa o PDF do pedido (ex.: SERDI/VELO) → produtos + estoque   ║
-- ║  + contas a pagar (parceláveis). De-para guarda o código do       ║
-- ║  fornecedor p/ casar automaticamente nas próximas importações.    ║
-- ╚══════════════════════════════════════════════════════════════════╝

create type purchase_order_status as enum ('rascunho', 'confirmado', 'cancelado');
create type purchase_order_origin as enum ('upload', 'telegram');

-- ─── PEDIDOS ─────────────────────────────────────────────────────────
create table public.purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  numero_pedido text,
  fornecedor_cnpj text,                  -- como veio no PDF (antes de casar)
  fornecedor_nome text,
  emitido_em date,
  valor_total numeric not null default 0,
  parcelas integer not null default 1,
  status purchase_order_status not null default 'rascunho',
  origem purchase_order_origin not null default 'upload',
  raw_text text,                         -- texto bruto extraído (auditoria)
  confirmado_em timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.purchase_orders (tenant_id);
create index on public.purchase_orders (tenant_id, status);
create index on public.purchase_orders (tenant_id, supplier_id);
-- idempotência: o mesmo pedido do mesmo fornecedor não entra 2x
create unique index purchase_orders_dedupe
  on public.purchase_orders (tenant_id, supplier_id, numero_pedido)
  where numero_pedido is not null and supplier_id is not null;

-- ─── ITENS DO PEDIDO ─────────────────────────────────────────────────
create table public.purchase_order_items (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  purchase_order_id uuid not null
    references public.purchase_orders(id) on delete cascade,
  codigo_fornecedor text,                -- código no PDF (811, 123…)
  descricao text not null,
  quantidade numeric not null default 0,
  valor_unitario numeric not null default 0,
  valor_total numeric not null default 0,
  -- casamento com o catálogo (preenchido na conferência):
  product_id uuid references public.products(id) on delete set null,
  criar_novo boolean not null default false,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);
create index on public.purchase_order_items (tenant_id);
create index on public.purchase_order_items (purchase_order_id);
create index on public.purchase_order_items (product_id);

-- ─── DE-PARA: código do fornecedor ↔ produto ─────────────────────────
create table public.supplier_product_codes (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  codigo_fornecedor text not null,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.supplier_product_codes (tenant_id);
create unique index supplier_product_codes_uniq
  on public.supplier_product_codes (tenant_id, supplier_id, codigo_fornecedor);

-- ─── updated_at + auditoria + RLS ────────────────────────────────────
create trigger t_purchase_orders_upd before update on public.purchase_orders
  for each row execute function public.set_updated_at();
create trigger t_supplier_product_codes_upd before update
  on public.supplier_product_codes
  for each row execute function public.set_updated_at();

do $$
declare t text;
begin
  foreach t in array array[
    'purchase_orders','purchase_order_items','supplier_product_codes'
  ] loop
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
