-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — F13: Recursos Humanos                                 ║
-- ║  time_entries, absences, epi_deliveries, occupational_exams       ║
-- ║  (ASO = dado sensível LGPD: acesso restrito a owner/rh na app)    ║
-- ╚══════════════════════════════════════════════════════════════════╝

create type time_entry_type as enum ('entrada','saida');
create type absence_type as enum ('ferias','atestado','licenca','folga','falta');
create type absence_status as enum ('solicitada','aprovada','recusada');
create type exam_type as enum ('admissional','periodico','demissional','retorno','mudanca');

-- ─── PONTO ELETRÔNICO ────────────────────────────────────────────────
create table public.time_entries (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  tipo time_entry_type not null,
  registrado_em timestamptz not null default now(),
  lat numeric, lng numeric,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.time_entries (tenant_id);
create index on public.time_entries (employee_id, registrado_em desc);

-- ─── FÉRIAS / AUSÊNCIAS ──────────────────────────────────────────────
create table public.absences (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  tipo absence_type not null default 'ferias',
  inicio date not null,
  fim date not null,
  status absence_status not null default 'solicitada',
  motivo text,
  anexo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.absences (tenant_id);
create index on public.absences (employee_id);

-- ─── EPI (NR-6) ──────────────────────────────────────────────────────
create table public.epi_deliveries (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  descricao text not null,
  entregue_em date not null default current_date,
  validade date,
  assinado boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.epi_deliveries (tenant_id);
create index on public.epi_deliveries (employee_id);

-- ─── EXAMES OCUPACIONAIS (ASO) — DADO SENSÍVEL LGPD ──────────────────
create table public.occupational_exams (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  tipo exam_type not null default 'periodico',
  data date not null default current_date,
  validade date,
  resultado text,                    -- apto | inapto | apto_com_restricao
  anexo_url text,
  created_at timestamptz not null default now()
);
create index on public.occupational_exams (tenant_id);
create index on public.occupational_exams (employee_id);

-- ─── updated_at + auditoria + RLS ────────────────────────────────────
create trigger t_absences_upd before update on public.absences
  for each row execute function public.set_updated_at();

do $$
declare t text;
begin
  foreach t in array array[
    'time_entries','absences','epi_deliveries','occupational_exams'
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
