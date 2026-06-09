-- ============================================================
-- Juros do cartão (parcelamento): % ao mês cobrado do cliente a partir da 3x.
-- Rodar UMA VEZ no SQL Editor do Supabase do CRM.
-- ============================================================

alter table public.payment_integrations
  add column if not exists juros_cartao_pct numeric not null default 0;
