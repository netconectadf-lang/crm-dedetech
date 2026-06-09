-- ============================================================
-- Contas a Receber: registrar quem cadastrou (usuário CRM ou pessoa do bot Telegram).
-- Rodar UMA VEZ no SQL Editor do Supabase do CRM.
-- ============================================================

alter table public.accounts_receivable
  add column if not exists created_by uuid references auth.users(id);

alter table public.accounts_receivable
  add column if not exists created_by_nome text;
