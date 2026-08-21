-- =========================================
-- Fase 0: miembros/afiliados del club
-- Ver CLAUDE.md secciones 5, 11.2, 14 (Fase 0)
-- =========================================

create table members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id),  -- null hasta que el miembro active su portal
  full_name text not null,
  email text,
  phone text not null,                     -- obligatorio: es el canal de WhatsApp
  document_id text,                        -- cédula
  birth_date date,
  photo_url text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  status text not null default 'active' check (status in ('active','inactive','frozen','expired')),
  join_date date not null default current_date,
  qr_code text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on members (organization_id);
create index on members (user_id);

grant select, insert, update, delete on members to authenticated;
grant select, insert, update, delete on members to service_role;

alter table members enable row level security;

-- Staff (owner/admin/staff/trainer) del club ve todos los miembros de su club.
create policy "members_select_staff_same_org"
on members for select
using (
  organization_id in (select private.user_org_ids())
  or private.is_platform_admin()
);

-- Un member autenticado (portal) ve/edita solo su propia fila.
create policy "members_select_self"
on members for select
using (user_id = auth.uid());

create policy "members_update_self"
on members for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Solo owner/admin/staff pueden crear, editar o borrar miembros del club.
create policy "members_insert_admin_roles"
on members for insert
with check (private.user_org_role(organization_id) in ('owner','admin','staff'));

create policy "members_update_admin_roles"
on members for update
using (private.user_org_role(organization_id) in ('owner','admin','staff'));

create policy "members_delete_admin_roles"
on members for delete
using (private.user_org_role(organization_id) in ('owner','admin'));
