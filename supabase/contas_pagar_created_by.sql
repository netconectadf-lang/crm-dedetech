-- ============================================================
-- Contas a Pagar: registrar quem cadastrou o lançamento.
-- Rodar UMA VEZ no SQL Editor do Supabase do CRM.
-- ============================================================

alter table public.accounts_payable
  add column if not exists created_by uuid references auth.users(id);

-- Nome do autor quando NÃO é um usuário do CRM (ex.: pessoa que lançou pelo bot do Telegram)
alter table public.accounts_payable
  add column if not exists created_by_nome text;
