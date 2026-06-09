-- ============================================================
-- Contas a Pagar: registrar quem cadastrou o lançamento.
-- Rodar UMA VEZ no SQL Editor do Supabase do CRM.
-- ============================================================

alter table public.accounts_payable
  add column if not exists created_by uuid references auth.users(id);
