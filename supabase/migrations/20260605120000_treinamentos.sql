-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — Treinamentos & certificações por funcionário (SST/RH) ║
-- ║  NRs, aplicação de produtos, integração — com validade e alerta.  ║
-- ╚══════════════════════════════════════════════════════════════════╝

create table if not exists public.trainings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  nome text not null,
  categoria text,            -- nr | aplicacao_produtos | integracao | reciclagem | outro
  instituicao text,
  concluido_em date,
  validade date,             -- vazio = sem validade
  anexo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trainings_emp_idx on public.trainings (employee_id);
create index if not exists trainings_tenant_idx on public.trainings (tenant_id);

-- ─── updated_at + auditoria + RLS ────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['trainings'] loop
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
