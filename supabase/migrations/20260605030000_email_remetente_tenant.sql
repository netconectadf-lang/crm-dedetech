-- E-mail por empresa (multi-tenant, Modelo A: domínio compartilhado + nome/reply-to
-- por tenant). O envio sai do domínio do sistema (RESEND_FROM), mas com o NOME da
-- empresa e as respostas indo para o e-mail dela.
alter table public.tenants
  add column if not exists email_remetente_nome text,
  add column if not exists email_responder_para text;
