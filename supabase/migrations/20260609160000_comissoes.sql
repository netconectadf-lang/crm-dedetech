-- Comissões de vendedores e técnicos.
-- Modelo da A7: vendedor + técnico, comissão sobre o valor RECEBIDO (liberada
-- quando o cliente paga a conta), percentual definido caso a caso.
create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  ar_id uuid references public.accounts_receivable(id) on delete cascade,
  os_id uuid references public.service_orders(id) on delete set null,
  employee_id uuid not null references public.employees(id) on delete restrict,
  tipo text not null check (tipo in ('vendedor', 'tecnico')),
  percentual numeric,                       -- % sobre a base (quando por percentual)
  valor_fixo numeric,                       -- valor fixo (alternativa ao %)
  base_valor numeric not null default 0,    -- snapshot do valor da conta a receber
  valor numeric not null default 0,         -- comissão calculada
  status text not null default 'provisionada'
    check (status in ('provisionada', 'liberada', 'paga', 'cancelada')),
  liberada_em timestamptz,
  paga_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_comm_emp on public.commissions (tenant_id, employee_id, status);
create index if not exists idx_comm_ar on public.commissions (tenant_id, ar_id);

do $$
declare t text;
begin
  foreach t in array array['commissions'] loop
    execute format('create trigger t_%1$s_upd before update on public.%1$s for each row execute function public.set_updated_at();', t);
    execute format('create trigger t_%1$s_audit after insert or update or delete on public.%1$s for each row execute function public.audit_trigger();', t);
    execute format('alter table public.%1$s enable row level security;', t);
    execute format('create policy %1$s_tenant on public.%1$s for all using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id());', t);
  end loop;
end $$;
