-- Link de avaliação no Google por empresa. Clientes promotores (NPS 9-10)
-- recebem este link automaticamente após responder a pesquisa (Fase 6).
alter table public.tenants
  add column if not exists google_review_url text;
