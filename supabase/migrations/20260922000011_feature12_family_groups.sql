create table if not exists family_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  discount_amount numeric(10,2),
  discount_percent numeric(5,2),
  created_at timestamptz not null default now()
);
create index if not exists family_groups_org_idx on family_groups(organization_id);

create table if not exists family_group_members (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid not null references family_groups(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  unique (family_group_id, member_id)
);
create index if not exists fgm_group_idx on family_group_members(family_group_id);
create index if not exists fgm_member_idx on family_group_members(member_id);

alter table family_groups enable row level security;
alter table family_group_members enable row level security;

create policy "family_groups_select" on family_groups for select
  using (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and status = 'active'
  ));
create policy "family_groups_write" on family_groups for all
  using (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and status = 'active' and role in ('owner','admin')
  ));

create policy "fgm_select" on family_group_members for select
  using (family_group_id in (
    select id from family_groups fg where fg.organization_id in (
      select organization_id from organization_members where user_id = auth.uid() and status = 'active'
    )
  ));
create policy "fgm_write" on family_group_members for all
  using (family_group_id in (
    select id from family_groups fg where fg.organization_id in (
      select organization_id from organization_members where user_id = auth.uid() and status = 'active' and role in ('owner','admin')
    )
  ));

grant select, insert, update, delete on family_groups to service_role;
grant select, insert, update, delete on family_group_members to service_role;
