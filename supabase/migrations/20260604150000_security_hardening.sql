-- ============================================================
-- Hardening de segurança (auditoria 2026-06-04)
-- ============================================================

-- [CRÍTICO] Isolamento multi-tenant.
-- 1) O hook do JWT só define tenant_id se HOUVER membership correspondente
--    (antes lia profiles.active_tenant_id cru → forjável).
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  claims jsonb := event->'claims';
  v_uid uuid := (event->>'user_id')::uuid;
  v_tenant uuid;
  v_role app_role;
begin
  -- tenant ativo SOMENTE se existir membership do usuário naquele tenant
  select m.tenant_id, m.role into v_tenant, v_role
  from public.profiles p
  join public.memberships m on m.user_id = p.id and m.tenant_id = p.active_tenant_id
  where p.id = v_uid;

  -- fallback: 1ª membership (quando active_tenant_id é null ou inválido)
  if v_tenant is null then
    select tenant_id, role into v_tenant, v_role
    from public.memberships where user_id = v_uid order by created_at limit 1;
  end if;

  claims := jsonb_set(claims, '{tenant_id}', coalesce(to_jsonb(v_tenant::text),'null'::jsonb));
  claims := jsonb_set(claims, '{user_role}', coalesce(to_jsonb(v_role::text),'null'::jsonb));
  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- 2) Profile não pode apontar active_tenant_id para tenant sem membership.
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for all
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and (
      active_tenant_id is null
      or exists (
        select 1 from public.memberships m
        where m.user_id = auth.uid() and m.tenant_id = active_tenant_id
      )
    )
  );

-- [ALTO] RPC de numeração de NFS-e: validar membership do chamador no tenant.
create or replace function public.nfse_reservar_numero(p_tenant uuid)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_num bigint;
begin
  if not exists (
    select 1 from public.memberships where user_id = auth.uid() and tenant_id = p_tenant
  ) then
    raise exception 'Sem permissão para reservar número de NFS-e neste tenant';
  end if;
  update public.tenants set nfse_proximo_numero = nfse_proximo_numero + 1
    where id = p_tenant returning nfse_proximo_numero - 1 into v_num;
  if v_num is null then
    raise exception 'Empresa % não encontrada para reservar número de NFS-e', p_tenant;
  end if;
  return v_num;
end;
$$;

-- [ALTO] Bucket de assinaturas (PII): privado + acesso restrito por tenant.
update storage.buckets set public = false where id = 'assinaturas';
drop policy if exists assinaturas_tenant on storage.objects;
create policy assinaturas_tenant on storage.objects for all to authenticated
  using (bucket_id = 'assinaturas' and (storage.foldername(name))[1] = current_tenant_id()::text)
  with check (bucket_id = 'assinaturas' and (storage.foldername(name))[1] = current_tenant_id()::text);

-- [BAIXO] audit_log imutável: nega update/delete a usuários
-- (insert já é negado por ausência de policy; só o trigger SECURITY DEFINER escreve).
drop policy if exists audit_no_update on public.audit_log;
drop policy if exists audit_no_delete on public.audit_log;
create policy audit_no_update on public.audit_log for update to authenticated using (false);
create policy audit_no_delete on public.audit_log for delete to authenticated using (false);
