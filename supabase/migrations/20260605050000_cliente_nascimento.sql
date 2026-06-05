-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — Data de nascimento do cliente (lembrete de aniversário)║
-- ╚══════════════════════════════════════════════════════════════════╝

alter table public.clients
  add column if not exists data_nascimento date;
