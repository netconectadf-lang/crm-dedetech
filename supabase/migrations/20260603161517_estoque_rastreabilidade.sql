-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — F5: Estoque com Rastreabilidade                       ║
-- ║  stock_batches (lotes) + stock_movements (+ trigger de saldo)     ║
-- ╚══════════════════════════════════════════════════════════════════╝

create type stock_movement_type as enum (
  'entrada','saida','perda','ajuste','transferencia'
);

-- ─── LOTES ───────────────────────────────────────────────────────────
create table public.stock_batches (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  lote text,
  validade date,
  fabricante text,
  nf_entrada text,
  data_entrada date not null default current_date,
  qtd_entrada numeric not null default 0,
  qtd_atual numeric not null default 0,             -- mantido pelo trigger
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.stock_batches (tenant_id);
create index on public.stock_batches (product_id);
create index on public.stock_batches (tenant_id, validade);

-- ─── MOVIMENTAÇÕES ───────────────────────────────────────────────────
create table public.stock_movements (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  batch_id uuid references public.stock_batches(id) on delete set null,
  tipo stock_movement_type not null,
  quantidade numeric not null,                      -- assinada (+entrada / -saída)
  motivo text,
  -- rastreabilidade com OS (Fase 6)
  related_kind text,                                -- 'os' | null
  related_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.stock_movements (tenant_id);
create index on public.stock_movements (batch_id);
create index on public.stock_movements (product_id);
create index on public.stock_movements (related_kind, related_id);

-- ─── Trigger: mantém qtd_atual do lote ───────────────────────────────
create or replace function public.fn_apply_stock_movement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.batch_id is not null then
    update public.stock_batches
      set qtd_atual = qtd_atual + new.quantidade
      where id = new.batch_id;
  end if;
  return new;
end;
$$;

create trigger t_stock_movement_apply
  after insert on public.stock_movements
  for each row execute function public.fn_apply_stock_movement();

-- ─── updated_at + auditoria + RLS ────────────────────────────────────
create trigger t_stock_batches_upd before update on public.stock_batches
  for each row execute function public.set_updated_at();

do $$
declare t text;
begin
  foreach t in array array['stock_batches','stock_movements'] loop
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
