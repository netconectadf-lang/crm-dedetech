-- Geocoding: marca clientes cujo endereço não pôde ser convertido em
-- coordenadas, para não reprocessá-los a cada rodada de geocoding em lote.
alter table public.clients
  add column if not exists geo_falhou boolean not null default false;
