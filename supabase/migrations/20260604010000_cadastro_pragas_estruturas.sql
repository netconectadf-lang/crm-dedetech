-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — Cadastro de Pragas e Estruturas (selecionáveis na OS) ║
-- ║  Listas próprias por empresa; a ficha da OS escolhe daqui e pode  ║
-- ║  cadastrar novas na hora. service_orders ganha `estruturas`.      ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ─── PRAGAS ──────────────────────────────────────────────────────────
create table public.pragas (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.pragas (tenant_id);
create unique index pragas_nome_uniq on public.pragas (tenant_id, lower(nome));

-- ─── ESTRUTURAS / ÁREAS ──────────────────────────────────────────────
create table public.estruturas (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.estruturas (tenant_id);
create unique index estruturas_nome_uniq on public.estruturas (tenant_id, lower(nome));

-- ─── OS: áreas/estruturas tratadas (espelha o array de pragas) ───────
alter table public.service_orders
  add column if not exists estruturas text[] not null default '{}';

-- ─── updated_at + auditoria + RLS ────────────────────────────────────
-- ─── Seed: pragas urbanas mais comuns (todos os tenants, idempotente) ─
insert into public.pragas (tenant_id, nome)
select t.id, p.nome
from public.tenants t
cross join (values
  ('Barata-americana'),
  ('Barata-francesinha'),
  ('Barata-oriental'),
  ('Cupim de madeira seca'),
  ('Cupim subterrâneo'),
  ('Cupim arborícola'),
  ('Formiga doméstica'),
  ('Formiga-fantasma'),
  ('Formiga cortadeira (saúva)'),
  ('Formiga lava-pés'),
  ('Ratazana (rato de esgoto)'),
  ('Rato de telhado'),
  ('Camundongo'),
  ('Escorpião amarelo'),
  ('Escorpião marrom'),
  ('Aranha marrom'),
  ('Aranha armadeira'),
  ('Viúva-negra'),
  ('Pulga'),
  ('Carrapato'),
  ('Percevejo de cama'),
  ('Mosquito (Aedes aegypti)'),
  ('Pernilongo (Culex)'),
  ('Mosca doméstica'),
  ('Mosca-da-fruta'),
  ('Mosquito-palha'),
  ('Pombo'),
  ('Morcego'),
  ('Traça'),
  ('Caruncho / Gorgulho'),
  ('Lacraia / Centopeia'),
  ('Lesma / Caramujo'),
  ('Marimbondo / Vespa'),
  ('Abelha'),
  ('Barbeiro')
) as p(nome)
on conflict do nothing;

-- ─── Seed: áreas/estruturas tratadas (todos os tenants, idempotente) ──
insert into public.estruturas (tenant_id, nome)
select t.id, e.nome
from public.tenants t
cross join (values
  ('Administração'), ('Almoxarifado'), ('Área comum'), ('Área de serviço'),
  ('Área externa'), ('Área interna'), ('Banheiro'), ('Bar'),
  ('Caixa de esgoto'), ('Caixa de gordura'), ('Cantina'), ('Casa de bombas'),
  ('Casa de máquinas'), ('Casa de passagem'), ('Churrasqueira'), ('Cobertura'),
  ('Comércio / Loja'), ('Container'), ('Convés'), ('Copa'), ('Corredor'),
  ('Cozinha'), ('Depósito'), ('Despensa'), ('Escada'), ('Escritório'),
  ('Forro'), ('Galeria de passagem'), ('Garagem'), ('Guarita'),
  ('Hall / Lobby'), ('Jardim'), ('Jardim de inverno'), ('Lavanderia'),
  ('Lixeira / Central de lixo'), ('Mezanino'), ('Pátio'), ('Pérgola'),
  ('Praça de alimentação'), ('Produção'), ('Quarto'), ('Quarto de empregada'),
  ('Quintal'), ('Ralos'), ('Recepção'), ('Refeitório'), ('Sala'),
  ('Sala de jantar'), ('Sala de reuniões'), ('Salão de festas'), ('Sótão'),
  ('Subsolo'), ('Telhado'), ('Terraço'), ('Varanda'), ('Vestiário')
) as e(nome)
on conflict do nothing;

do $$
declare t text;
begin
  foreach t in array array['pragas','estruturas'] loop
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
