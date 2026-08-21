-- =========================================
-- Fase 1 (módulo 8.1 logo de club, 8.3 foto de miembro): buckets de Storage.
-- Ver CLAUDE.md §2 y §11.1: buckets privados, URLs firmadas de corta duración.
-- Convención de path: {organization_id}/{archivo} — permite que las
-- políticas de storage.objects reutilicen private.user_org_ids().
-- =========================================

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', false),
  ('payment-proofs', 'payment-proofs', false),
  ('org-logos', 'org-logos', false),
  ('certifications', 'certifications', false)
on conflict (id) do nothing;

-- org-logos: solo staff (owner/admin) del club puede subir/reemplazar el logo.
-- Cualquier miembro del club (staff) puede leerlo (para mostrarlo en dashboard/portal).
create policy "org_logos_select_same_org"
on storage.objects for select
using (
  bucket_id = 'org-logos'
  and (storage.foldername(name))[1]::uuid in (select private.user_org_ids())
);

create policy "org_logos_write_owner_admin"
on storage.objects for insert
with check (
  bucket_id = 'org-logos'
  and private.user_org_role((storage.foldername(name))[1]::uuid) in ('owner','admin')
);

create policy "org_logos_update_owner_admin"
on storage.objects for update
using (
  bucket_id = 'org-logos'
  and private.user_org_role((storage.foldername(name))[1]::uuid) in ('owner','admin')
);

create policy "org_logos_delete_owner_admin"
on storage.objects for delete
using (
  bucket_id = 'org-logos'
  and private.user_org_role((storage.foldername(name))[1]::uuid) in ('owner','admin')
);

-- avatars: foto de un miembro. Path: {organization_id}/{member_id}-{archivo}.
-- Staff del club (owner/admin/staff) puede leer/escribir avatares de su club.
create policy "avatars_select_same_org"
on storage.objects for select
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1]::uuid in (select private.user_org_ids())
);

create policy "avatars_write_admin_roles"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and private.user_org_role((storage.foldername(name))[1]::uuid) in ('owner','admin','staff')
);

create policy "avatars_update_admin_roles"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and private.user_org_role((storage.foldername(name))[1]::uuid) in ('owner','admin','staff')
);

create policy "avatars_delete_admin_roles"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and private.user_org_role((storage.foldername(name))[1]::uuid) in ('owner','admin','staff')
);

-- payment-proofs y certifications: políticas se agregan en la fase que
-- implementa esos módulos (8.5 pagos, gestión de certificaciones de
-- entrenadores) porque su patrón de acceso (member sube su propio
-- comprobante) es distinto y depende de la tabla payments. Ver PROGRESS.md.
