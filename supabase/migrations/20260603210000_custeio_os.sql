-- ============================================================
-- Custeio de OS: custo de produto + combustível + mão de obra
-- e margem por ordem de serviço.
-- ============================================================

-- Config da empresa (preço do combustível e custo/hora padrão de fallback)
alter table public.tenants
  add column if not exists preco_combustivel_litro numeric,
  add column if not exists custo_hora_padrao numeric;

-- Consumo do veículo (km por litro) para calcular combustível
alter table public.vehicles
  add column if not exists consumo_km_l numeric;

-- Captura na OS (preenchidos na ficha) + snapshot de custos (na finalização)
alter table public.service_orders
  add column if not exists km_rodado numeric,
  add column if not exists tempo_execucao_min integer,
  add column if not exists custo_produtos numeric,
  add column if not exists custo_combustivel numeric,
  add column if not exists custo_mao_obra numeric;

-- Custo total = soma dos três (coluna gerada — sempre consistente)
alter table public.service_orders
  add column if not exists custo_total numeric
  generated always as (
    coalesce(custo_produtos, 0)
    + coalesce(custo_combustivel, 0)
    + coalesce(custo_mao_obra, 0)
  ) stored;
