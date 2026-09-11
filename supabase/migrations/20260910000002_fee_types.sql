create table if not exists fee_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  discount_percent numeric(5,2) not null default 0
    check (discount_percent >= 0 and discount_percent <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists fee_types_org_idx on fee_types(organization_id);

alter table members
  add column if not exists fee_type_id uuid references fee_types(id) on delete set null;
create index if not exists members_fee_type_id_idx on members(fee_type_id);
