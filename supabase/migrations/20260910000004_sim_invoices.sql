create table if not exists sim_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  sequential_number int not null,
  recipient_name text not null,
  recipient_document text not null,
  recipient_address text,
  concept text not null,
  subtotal numeric(10,2) not null,
  tax_rate numeric(5,2) not null default 15.00,
  tax_amount numeric(10,2) not null,
  total numeric(10,2) not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id, sequential_number)
);
create index if not exists sim_invoices_org_idx on sim_invoices(organization_id);
