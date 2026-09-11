-- Nuevas columnas en members para perfil extendido
alter table members
  add column if not exists school text,
  add column if not exists grade text,
  add column if not exists registration_status text not null default 'approved'
    check (registration_status in ('pending_approval','approved','rejected'));

-- Datos médicos del miembro (relación 1:1)
create table if not exists member_medical_info (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade unique,
  blood_type text,
  allergies text,
  conditions text,
  medications text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Representantes/tutores del miembro (1:many, uno puede ser is_primary)
create table if not exists member_representatives (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  full_name text not null,
  relationship text not null,
  phone text not null,
  email text,
  document_id text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists member_representatives_member_id_idx on member_representatives(member_id);
