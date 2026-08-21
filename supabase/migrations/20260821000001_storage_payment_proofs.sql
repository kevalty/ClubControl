-- =========================================
-- Fase 2 (módulo 8.5): políticas de storage.objects para el bucket
-- payment-proofs, creado en Fase 1 (20260820000006) pero sin policies
-- todavía porque su patrón de acceso depende de la tabla payments.
-- Convención de path: {organization_id}/{payment_id}-{archivo}.
-- =========================================

-- Staff del club ve todos los comprobantes de su club.
create policy "payment_proofs_select_staff_same_org"
on storage.objects for select
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1]::uuid in (select private.user_org_ids())
);

-- Staff (owner/admin/staff) puede subir comprobantes (registra el pago de
-- un miembro desde el dashboard). El self-service del member sube su propio
-- comprobante desde el portal — se habilita en Fase 5 con una policy
-- adicional que valide contra members.user_id, no hace falta todavía porque
-- el portal no existe aún.
create policy "payment_proofs_insert_admin_roles"
on storage.objects for insert
with check (
  bucket_id = 'payment-proofs'
  and private.user_org_role((storage.foldername(name))[1]::uuid) in ('owner','admin','staff')
);

create policy "payment_proofs_delete_admin_roles"
on storage.objects for delete
using (
  bucket_id = 'payment-proofs'
  and private.user_org_role((storage.foldername(name))[1]::uuid) in ('owner','admin')
);
