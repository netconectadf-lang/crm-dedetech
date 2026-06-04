-- ============================================================
-- NFS-e Nacional (gov.br) — integração DIRETA, sem provedor pago.
-- Complementa 20260603230000_nfse.sql (que era Focus NFe).
-- ============================================================

-- Parâmetros adicionais do emissor nacional na empresa.
alter table public.tenants
  add column if not exists nfse_ambiente smallint not null default 2,        -- 1=Produção; 2=Produção Restrita/Homologação
  add column if not exists nfse_serie text not null default '1',
  add column if not exists nfse_proximo_numero bigint not null default 1,
  add column if not exists nfse_cod_trib_nacional text,                       -- código de tributação nacional (6 dígitos LC116)
  add column if not exists nfse_op_simples_nacional smallint not null default 3, -- 1=Não optante; 2=MEI; 3=ME/EPP
  add column if not exists nfse_reg_especial smallint not null default 0;     -- 0=Nenhum .. 9=Outros

-- Campos do fluxo nacional na tabela de notas já existente.
alter table public.nfse
  add column if not exists chave_acesso text,   -- 50 dígitos quando autorizada
  add column if not exists id_dps text,         -- Id da DPS (45 pos) — idempotência
  add column if not exists ambiente smallint,   -- 1|2
  add column if not exists xml text;            -- XML da NFS-e autorizada

create index if not exists idx_nfse_chave on public.nfse (chave_acesso);
create unique index if not exists uq_nfse_id_dps on public.nfse (id_dps) where id_dps is not null;

-- ------------------------------------------------------------
-- Certificado digital A1 por empresa (PFX + senha CRIPTOGRAFADOS na app).
-- RLS sem policy permissiva: acesso somente via service role (server-side).
-- ------------------------------------------------------------
create table if not exists public.nfse_certificado (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  pfx_cripto text not null,        -- .pfx criptografado (AES-256-GCM) + base64
  senha_cripto text not null,      -- senha do .pfx criptografada
  titular_doc text,                -- CNPJ/CPF do titular (extraído do cert)
  validade date,                   -- validade do certificado (notBefore/notAfter)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists t_nfse_cert_upd on public.nfse_certificado;
create trigger t_nfse_cert_upd before update on public.nfse_certificado
  for each row execute function public.set_updated_at();

alter table public.nfse_certificado enable row level security;
-- (nenhuma policy → bloqueado para usuários; apenas service role acessa)

-- ------------------------------------------------------------
-- Reserva atômica do próximo número da DPS para a empresa.
-- ------------------------------------------------------------
create or replace function public.nfse_reservar_numero(p_tenant uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_num bigint;
begin
  update public.tenants
     set nfse_proximo_numero = nfse_proximo_numero + 1
   where id = p_tenant
   returning nfse_proximo_numero - 1 into v_num;
  if v_num is null then
    raise exception 'Empresa % não encontrada para reservar número de NFS-e', p_tenant;
  end if;
  return v_num;
end;
$$;
