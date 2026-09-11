create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists locations_org_idx on locations(organization_id);

alter table members
  add column if not exists location_id uuid references locations(id) on delete set null;

alter table classes
  add column if not exists location_id uuid references locations(id) on delete set null;
