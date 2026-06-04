alter table public.quotes alter column deal_id drop not null;

alter table public.quotes
  add column if not exists client_id uuid references public.clients(id) on delete set null;

create index if not exists idx_quotes_client on public.quotes (client_id);
