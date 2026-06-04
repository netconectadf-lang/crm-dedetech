-- ============================================================
-- Storage: bucket para assinaturas dos clientes (certificado).
-- Bucket público (a assinatura aparece no certificado/PDF do cliente).
-- Upload é feito pelo servidor via service_role (bypassa RLS).
-- ============================================================

insert into storage.buckets (id, name, public)
values ('assinaturas', 'assinaturas', true)
on conflict (id) do nothing;
