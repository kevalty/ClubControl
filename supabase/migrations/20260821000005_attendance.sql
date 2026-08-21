-- =========================================
-- Fase 4 (módulo 8.7): asistencia / control de acceso.
-- =========================================

create table attendance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  method text not null default 'qr' check (method in ('qr','manual','staff')),
  checked_in_by uuid references auth.users(id) -- null si fue self-service por QR
);
create index on attendance (organization_id, member_id, checked_in_at);

grant select, insert on attendance to authenticated;
grant select, insert, update, delete on attendance to service_role;

alter table attendance enable row level security;

create policy "attendance_select_staff_same_org"
on attendance for select
using (
  organization_id in (select private.user_org_ids())
  or private.is_platform_admin()
);

create policy "attendance_select_self"
on attendance for select
using (
  exists (
    select 1 from members m
    where m.id = attendance.member_id and m.user_id = auth.uid()
  )
);

-- Check-in manual/por staff (recepción marca a un miembro a mano). El
-- check-in por QR desde el kiosco público (CLAUDE.md §8.7: "self-service
-- por QR", sin sesión) NO pasa por esta policy — usa el service_role client
-- desde /api/checkin/[orgSlug], validado ahí mismo contra la regla §6.5.
create policy "attendance_insert_admin_roles"
on attendance for insert
with check (private.user_org_role(organization_id) in ('owner','admin','staff'));
