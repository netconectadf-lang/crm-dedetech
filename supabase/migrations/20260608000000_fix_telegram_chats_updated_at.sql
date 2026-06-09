-- Fix: telegram_chats foi criada por uma migration antiga sem a coluna
-- updated_at, mas o trigger t_tgchats_upd (set_updated_at) referencia esse
-- campo. Resultado: TODO update na tabela falha com
--   record "new" has no field "updated_at"
-- o que impedia aprovar/bloquear chats no painel de Integrações.
alter table public.telegram_chats
  add column if not exists updated_at timestamptz not null default now();
