-- ============================================================
-- Página de pagamento própria (/pagar/[token]): token público por cobrança
-- + QR Code PIX em imagem. Rodar UMA VEZ no SQL Editor do Supabase do CRM.
-- ============================================================

alter table public.charges
  add column if not exists pay_token text,
  add column if not exists pix_qr    text;   -- QR Code em base64 (encodedImage do Asaas)

create unique index if not exists idx_charges_pay_token
  on public.charges (pay_token);
