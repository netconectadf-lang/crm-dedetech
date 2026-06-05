-- Rate limit via Postgres (sem dependência externa) para proteger as ações
-- públicas (responder NPS, aceitar/recusar proposta) contra flood/abuso.

create table if not exists public.rate_limits (
  bucket text primary key,
  count int not null default 0,
  expires_at timestamptz not null
);

create index if not exists idx_rate_limits_expires on public.rate_limits (expires_at);

-- RLS deny-all: acesso só via a função (security definer) e service role.
alter table public.rate_limits enable row level security;

-- Consome 1 do balde `p_bucket` numa janela fixa de `p_window_seconds`.
-- Retorna true se ainda DENTRO do limite, false se estourou. Atômico.
create or replace function public.consume_rate_limit(
  p_bucket text,
  p_limit int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.rate_limits (bucket, count, expires_at)
    values (p_bucket, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (bucket) do update
    set count = case
          when public.rate_limits.expires_at < now() then 1
          else public.rate_limits.count + 1
        end,
        expires_at = case
          when public.rate_limits.expires_at < now()
            then now() + make_interval(secs => p_window_seconds)
          else public.rate_limits.expires_at
        end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;
