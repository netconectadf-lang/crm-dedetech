-- Bucket público para logos das empresas (tenants).
-- Público para que a logo apareça direto no certificado, laudos e propostas
-- via <img src> sem precisar de URL assinada. Upload é feito server-side
-- (service role), então não dependemos de policy de escrita para o app.

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Leitura pública dos objetos do bucket (reforço; bucket já é public).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'branding public read'
  ) then
    create policy "branding public read"
      on storage.objects for select
      to public
      using (bucket_id = 'branding');
  end if;
end $$;

-- Escrita por usuários autenticados (caso futuramente subam pelo client).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'branding authenticated write'
  ) then
    create policy "branding authenticated write"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = 'branding');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'branding authenticated update'
  ) then
    create policy "branding authenticated update"
      on storage.objects for update
      to authenticated
      using (bucket_id = 'branding');
  end if;
end $$;
