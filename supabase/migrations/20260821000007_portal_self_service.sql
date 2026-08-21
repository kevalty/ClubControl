-- =========================================
-- Fase 5 (sección 7, portal del miembro): policies de self-service que se
-- dejaron pendientes en fases anteriores porque el portal no existía
-- todavía. No se toca ninguna policy de staff, solo se agregan las de
-- member.
-- =========================================

-- Un member puede registrar su propio pago (subir su comprobante).
create policy "payments_insert_self"
on payments for insert
with check (
  exists (
    select 1 from members m
    where m.id = payments.member_id and m.user_id = auth.uid()
  )
);

-- Reservar/cancelar su propio cupo de clase.
create policy "class_bookings_insert_self"
on class_bookings for insert
with check (
  exists (
    select 1 from members m
    where m.id = class_bookings.member_id and m.user_id = auth.uid()
  )
);

create policy "class_bookings_update_self"
on class_bookings for update
using (
  exists (
    select 1 from members m
    where m.id = class_bookings.member_id and m.user_id = auth.uid()
  )
);

-- payment-proofs: convención de path para self-service del member:
-- {organization_id}/{member_id}/{archivo} (el mismo patrón que ya usa el
-- registro de pagos desde el dashboard de staff, ver
-- app/[orgSlug]/dashboard/pagos/actions.ts).
create policy "payment_proofs_select_self"
on storage.objects for select
using (
  bucket_id = 'payment-proofs'
  and exists (
    select 1 from members m
    where m.user_id = auth.uid()
      and m.organization_id = (storage.foldername(name))[1]::uuid
      and m.id = (storage.foldername(name))[2]::uuid
  )
);

create policy "payment_proofs_insert_self"
on storage.objects for insert
with check (
  bucket_id = 'payment-proofs'
  and exists (
    select 1 from members m
    where m.user_id = auth.uid()
      and m.organization_id = (storage.foldername(name))[1]::uuid
      and m.id = (storage.foldername(name))[2]::uuid
  )
);
