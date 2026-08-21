-- =========================================
-- Fase 1 (módulos 8.3/8.4): membresías asignadas a un miembro
-- =========================================

create table memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  plan_id uuid not null references membership_plans(id),
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('active','expired','frozen','cancelled')),
  auto_renew boolean not null default false,
  sessions_remaining int,                  -- solo para class_pack
  created_at timestamptz not null default now()
);
create index on memberships (organization_id, member_id);

grant select, insert, update, delete on memberships to authenticated;
grant select, insert, update, delete on memberships to service_role;

alter table memberships enable row level security;

create policy "memberships_select_staff_same_org"
on memberships for select
using (
  organization_id in (select private.user_org_ids())
  or private.is_platform_admin()
);

-- Un member ve solo sus propias membresías (portal, sección 7).
create policy "memberships_select_self"
on memberships for select
using (
  exists (
    select 1 from members m
    where m.id = memberships.member_id and m.user_id = auth.uid()
  )
);

create policy "memberships_write_admin_roles"
on memberships for insert
with check (private.user_org_role(organization_id) in ('owner','admin','staff'));

create policy "memberships_update_admin_roles"
on memberships for update
using (private.user_org_role(organization_id) in ('owner','admin','staff'));

create policy "memberships_delete_admin_roles"
on memberships for delete
using (private.user_org_role(organization_id) in ('owner','admin'));
