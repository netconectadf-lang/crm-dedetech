create table if not exists public.telegram_integrations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  bot_token text not null,
  bot_username text,
  webhook_secret text not null unique,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tgint_secret on public.telegram_integrations (webhook_secret);

create table if not exists public.telegram_chats (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  chat_id text not null,
  nome text,
  status text not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, chat_id)
);
create index if not exists idx_tgchats_tenant on public.telegram_chats (tenant_id);

create trigger t_tgint_upd before update on public.telegram_integrations
  for each row execute function public.set_updated_at();
create trigger t_tgchats_upd before update on public.telegram_chats
  for each row execute function public.set_updated_at();

do $$
declare t text;
begin
  foreach t in array array['telegram_integrations','telegram_chats'] loop
    execute format('create trigger t_%1$s_audit after insert or update or delete on public.%1$s for each row execute function public.audit_trigger();', t);
    execute format('alter table public.%1$s enable row level security;', t);
    execute format('create policy %1$s_tenant on public.%1$s for all using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id());', t);
  end loop;
end $$;
