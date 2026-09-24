-- Fix missing RLS policies and service_role grants.
-- The previous migration (20260922000001) stopped early because
-- teams_select_same_org already existed, leaving class_enrollments
-- without SELECT policies or service_role grants.
-- All statements here are idempotent / safe to run multiple times.

-- ── Enable RLS (idempotent) ──────────────────────────────────
alter table class_enrollments enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;

-- ── class_enrollments ────────────────────────────────────────
drop policy if exists "class_enrollments_select" on class_enrollments;
create policy "class_enrollments_select" on class_enrollments for select
  using (organization_id in (
    select organization_id from organization_members
    where user_id = auth.uid() and status = 'active'
  ));

drop policy if exists "class_enrollments_write" on class_enrollments;
create policy "class_enrollments_write" on class_enrollments for all
  using (organization_id in (
    select organization_id from organization_members
    where user_id = auth.uid() and status = 'active'
    and role in ('owner','admin','staff','trainer')
  ));

-- ── teams (skip if already exists) ──────────────────────────
do $$ begin
  create policy "teams_select_same_org" on teams for select
    using (organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid() and status = 'active'
    ));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "teams_write_admin_roles" on teams for all
    using (organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid() and status = 'active'
      and role in ('owner','admin','staff')
    ));
exception when duplicate_object then null;
end $$;

-- ── team_members ──────────────────────────────────────────────
drop policy if exists "team_members_select" on team_members;
create policy "team_members_select" on team_members for select
  using (team_id in (
    select t.id from teams t
    join organization_members om on om.organization_id = t.organization_id
    where om.user_id = auth.uid() and om.status = 'active'
  ));

drop policy if exists "team_members_write" on team_members;
create policy "team_members_write" on team_members for all
  using (team_id in (
    select t.id from teams t
    join organization_members om on om.organization_id = t.organization_id
    where om.user_id = auth.uid() and om.status = 'active'
    and om.role in ('owner','admin','staff')
  ));

-- ── service_role grants (safe to re-run) ─────────────────────
grant select, insert, update, delete on teams to service_role;
grant select, insert, update, delete on team_members to service_role;
grant select, insert, update, delete on class_enrollments to service_role;

-- ── org-logos storage bucket (public) ────────────────────────
insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;
