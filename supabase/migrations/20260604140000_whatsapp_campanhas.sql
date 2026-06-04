-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — Central de WhatsApp (Contatos + Scripts + Campanhas)  ║
-- ║  Disparo em massa via Evolution API, multi-tenant + RLS + audit.  ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ─── CONTATOS ────────────────────────────────────────────────────────
create table if not exists public.wa_contatos (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  telefone text not null,                         -- só dígitos, formato 55DDDNNNNNNNN
  variavel_1 text,
  variavel_2 text,
  variavel_3 text,
  tags text[] not null default '{}',
  status text not null default 'novo'
    check (status in ('novo','contatado','interessado','convertido','descartado','opt_out')),
  origem text not null default 'manual'
    check (origem in ('manual','csv','cliente','whatsapp')),
  client_id uuid references public.clients(id) on delete set null,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wa_contatos_tenant_idx on public.wa_contatos (tenant_id);
create unique index if not exists wa_contatos_tel_uniq on public.wa_contatos (tenant_id, telefone);

-- ─── SCRIPTS / TEMPLATES ─────────────────────────────────────────────
create table if not exists public.wa_scripts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  corpo text not null,                            -- aceita {{nome}}, {{var1}}, {{var2}}, {{var3}}, {{empresa}}
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wa_scripts_tenant_idx on public.wa_scripts (tenant_id);
create unique index if not exists wa_scripts_nome_uniq on public.wa_scripts (tenant_id, lower(nome));

-- ─── CAMPANHAS ───────────────────────────────────────────────────────
create table if not exists public.wa_campanhas (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nome text not null,
  script_id uuid references public.wa_scripts(id) on delete set null,
  status text not null default 'rascunho'
    check (status in ('rascunho','enviando','pausada','concluida')),
  intervalo_segundos int not null default 5,      -- delay anti-ban entre mensagens
  total_contatos int not null default 0,
  enviados int not null default 0,
  falhas int not null default 0,
  iniciada_em timestamptz,
  concluida_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wa_campanhas_tenant_idx on public.wa_campanhas (tenant_id);

-- ─── DISPAROS (status por destinatário) ──────────────────────────────
create table if not exists public.wa_disparos (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  campanha_id uuid not null references public.wa_campanhas(id) on delete cascade,
  contato_id uuid references public.wa_contatos(id) on delete set null,
  telefone text not null,                         -- snapshot do número no momento do disparo
  nome text,
  mensagem_enviada text,
  status text not null default 'pendente'
    check (status in ('pendente','enviado','falha')),
  erro text,
  provider_message_id text,
  enviado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wa_disparos_campanha_idx on public.wa_disparos (campanha_id, status);
create index if not exists wa_disparos_tenant_idx on public.wa_disparos (tenant_id);

-- ─── Seed: scripts prontos por empresa (idempotente) ─────────────────
insert into public.wa_scripts (tenant_id, nome, corpo)
select t.id, s.nome, s.corpo
from public.tenants t
cross join (values
  ('Lembrete de visita',
   $msg$Olá {{nome}}, tudo bem? 👋

Passando para lembrar da sua visita de controle de pragas agendada. Nossa equipe da {{empresa}} confirma a data combinada.

Qualquer coisa, é só responder por aqui. Até logo!$msg$),
  ('Pós-serviço e garantia',
   $msg$Oi {{nome}}! Aqui é da {{empresa}}. 🐜

Concluímos o serviço no seu imóvel. Lembrando que o tratamento tem garantia — se notar qualquer atividade de pragas no período, é só nos chamar que retornamos sem custo.

Obrigado pela confiança!$msg$),
  ('Reativação de cliente',
   $msg$Olá {{nome}}, tudo certo?

Faz um tempo que não cuidamos do controle de pragas do seu imóvel. Que tal agendar uma nova dedetização e manter o ambiente protegido?

Temos condição especial pra você. Posso te passar os detalhes?$msg$),
  ('Promoção / Oferta',
   $msg$Oi {{nome}}! 🎯

A {{empresa}} está com uma condição especial em dedetização e controle de pragas este mês. Vagas limitadas na agenda.

Quer que eu reserve um horário pra você?$msg$),
  ('Abordagem fria (novo lead)',
   $msg$Olá {{nome}}, tudo bem?

Sou da {{empresa}}, especializada em controle de pragas aqui na região. Trabalhamos com dedetização, descupinização e controle de roedores com garantia e certificado.

Posso te enviar um orçamento sem compromisso?$msg$)
) as s(nome, corpo)
on conflict do nothing;

-- ─── updated_at + auditoria + RLS ────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['wa_contatos','wa_scripts','wa_campanhas','wa_disparos'] loop
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
