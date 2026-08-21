-- =========================================
-- Fase 4 (módulo 8.8): clases, horarios y reservas.
-- =========================================

create table classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  trainer_user_id uuid references auth.users(id),
  capacity int not null default 20,
  location text,
  recurrence_rule jsonb not null, -- {"days": ["mon","wed","fri"], "start_time":"18:00", "end_time":"19:00"}
  is_active boolean not null default true
);
create index on classes (organization_id);

grant select, insert, update, delete on classes to authenticated;
grant select, insert, update, delete on classes to service_role;

alter table classes enable row level security;

create policy "classes_select_staff_same_org"
on classes for select
using (
  organization_id in (select private.user_org_ids())
  or private.is_platform_admin()
);

create policy "classes_select_member_portal"
on classes for select
using (
  is_active and exists (
    select 1 from members m
    where m.organization_id = classes.organization_id and m.user_id = auth.uid()
  )
);

create policy "classes_write_admin_roles"
on classes for insert
with check (private.user_org_role(organization_id) in ('owner','admin'));

create policy "classes_update_admin_roles"
on classes for update
using (private.user_org_role(organization_id) in ('owner','admin'));

create policy "classes_delete_admin_roles"
on classes for delete
using (private.user_org_role(organization_id) in ('owner','admin'));

create table class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'scheduled' check (status in ('scheduled','cancelled','completed'))
);
create index on class_sessions (organization_id, session_date);
create index on class_sessions (class_id, session_date);

grant select, insert, update, delete on class_sessions to authenticated;
grant select, insert, update, delete on class_sessions to service_role;

alter table class_sessions enable row level security;

create policy "class_sessions_select_staff_same_org"
on class_sessions for select
using (
  organization_id in (select private.user_org_ids())
  or private.is_platform_admin()
);

create policy "class_sessions_select_member_portal"
on class_sessions for select
using (
  exists (
    select 1 from members m
    where m.organization_id = class_sessions.organization_id and m.user_id = auth.uid()
  )
);

create policy "class_sessions_write_admin_roles"
on class_sessions for insert
with check (private.user_org_role(organization_id) in ('owner','admin'));

create policy "class_sessions_update_staff_roles"
on class_sessions for update
using (private.user_org_role(organization_id) in ('owner','admin','trainer'));

create policy "class_sessions_delete_admin_roles"
on class_sessions for delete
using (private.user_org_role(organization_id) in ('owner','admin'));

create table class_bookings (
  id uuid primary key default gen_random_uuid(),
  class_session_id uuid not null references class_sessions(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  status text not null default 'booked' check (status in ('booked','attended','no_show','cancelled')),
  booked_at timestamptz not null default now(),
  unique (class_session_id, member_id)
);
create index on class_bookings (organization_id, class_session_id);
create index on class_bookings (member_id);

grant select, insert, update, delete on class_bookings to authenticated;
grant select, insert, update, delete on class_bookings to service_role;

alter table class_bookings enable row level security;

create policy "class_bookings_select_staff_same_org"
on class_bookings for select
using (
  organization_id in (select private.user_org_ids())
  or private.is_platform_admin()
);

create policy "class_bookings_select_self"
on class_bookings for select
using (
  exists (
    select 1 from members m
    where m.id = class_bookings.member_id and m.user_id = auth.uid()
  )
);

-- Staff reserva/marca asistencia manualmente (CLAUDE.md §8.8). El
-- self-service del member (reservar su propio cupo) es Fase 5 — se agrega
-- ahí una policy adicional, no hace falta todavía porque el portal no existe.
create policy "class_bookings_write_staff_roles"
on class_bookings for insert
with check (private.user_org_role(organization_id) in ('owner','admin','staff','trainer'));

create policy "class_bookings_update_staff_roles"
on class_bookings for update
using (private.user_org_role(organization_id) in ('owner','admin','staff','trainer'));

create policy "class_bookings_delete_staff_roles"
on class_bookings for delete
using (private.user_org_role(organization_id) in ('owner','admin','staff'));
