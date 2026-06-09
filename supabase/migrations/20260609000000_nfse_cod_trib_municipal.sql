-- NFS-e: código de tributação municipal do ISSQN (exigido pelo leiaute do
-- DF/ISSnet, padrão nacional). Os demais campos da Reforma Tributária (CST,
-- cClassTrib, cIndOp) são derivados do código de tributação nacional em código
-- (lib/nfse-df/correlacao.ts), então não precisam ir para a tabela.
alter table public.tenants
  add column if not exists nfse_cod_trib_municipal text;
