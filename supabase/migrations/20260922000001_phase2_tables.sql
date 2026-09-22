-- ============================================================
-- 1. Columnas de documentos en members y member_representatives
-- ============================================================
alter table members
  add column if not exists cedula_url text;

alter table member_representatives
  add column if not exists cedula_url text;

-- ============================================================
-- 2. Tournament teams
-- ============================================================
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  sport text,
  category text,
  tournament_name text,
  tournament_date date,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists teams_org_idx on teams(organization_id);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (team_id, member_id)
);
create index if not exists team_members_team_idx on team_members(team_id);

-- ============================================================
-- 3. Class enrollments (permanent enrollment in a class)
-- ============================================================
create table if not exists class_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'inactive')),
  unique (class_id, member_id)
);
create index if not exists class_enrollments_class_idx on class_enrollments(class_id);
create index if not exists class_enrollments_member_idx on class_enrollments(member_id);

-- ============================================================
-- 4. Extend class_bookings.status to include 'justified'
-- ============================================================
alter table class_bookings
  drop constraint if exists class_bookings_status_check;
alter table class_bookings
  add constraint class_bookings_status_check
  check (status in ('booked', 'attended', 'no_show', 'cancelled', 'justified'));

-- ============================================================
-- 5. RLS — teams
-- ============================================================
alter table teams enable row level security;

create policy "teams_select_same_org" on teams for select
  using (organization_id in (
    select organization_id from organization_members
    where user_id = auth.uid() and status = 'active'
  ));

create policy "teams_write_admin_roles" on teams for insert, update, delete
  using (organization_id in (
    select organization_id from organization_members
    where user_id = auth.uid() and status = 'active' and role in ('owner','admin','staff')
  ));

-- ============================================================
-- 6. RLS — team_members
-- ============================================================
alter table team_members enable row level security;

create policy "team_members_select" on team_members for select
  using (team_id in (
    select t.id from teams t
    join organization_members om on om.organization_id = t.organization_id
    where om.user_id = auth.uid() and om.status = 'active'
  ));

create policy "team_members_write" on team_members for insert, update, delete
  using (team_id in (
    select t.id from teams t
    join organization_members om on om.organization_id = t.organization_id
    where om.user_id = auth.uid() and om.status = 'active' and om.role in ('owner','admin','staff')
  ));

-- ============================================================
-- 7. RLS — class_enrollments
-- ============================================================
alter table class_enrollments enable row level security;

create policy "class_enrollments_select" on class_enrollments for select
  using (organization_id in (
    select organization_id from organization_members
    where user_id = auth.uid() and status = 'active'
  ));

create policy "class_enrollments_write" on class_enrollments for insert, update, delete
  using (organization_id in (
    select organization_id from organization_members
    where user_id = auth.uid() and status = 'active' and role in ('owner','admin','staff','trainer')
  ));

-- ============================================================
-- 8. service_role grants
-- ============================================================
grant select, insert, update, delete on teams to service_role;
grant select, insert, update, delete on team_members to service_role;
grant select, insert, update, delete on class_enrollments to service_role;

-- ============================================================
-- 9. Storage bucket member-documents (private)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('member-documents', 'member-documents', false)
on conflict (id) do nothing;
