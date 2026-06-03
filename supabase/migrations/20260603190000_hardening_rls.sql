-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Dedetech — Hardening de RLS (LGPD): dado sensível por papel      ║
-- ║  ASO (exames ocupacionais = saúde) restrito a owner/rh no banco,  ║
-- ║  não só no app (defesa em profundidade).                          ║
-- ╚══════════════════════════════════════════════════════════════════╝
drop policy if exists occupational_exams_tenant on public.occupational_exams;
create policy occupational_exams_rh on public.occupational_exams for all
  using (tenant_id = current_tenant_id() and has_role(array['owner','rh']::app_role[]))
  with check (tenant_id = current_tenant_id() and has_role(array['owner','rh']::app_role[]));
