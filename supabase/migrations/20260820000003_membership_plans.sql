-- =========================================
-- Fase 1 (módulo 8.4): planes de membresía
-- =========================================

create table membership_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,                      -- "Mensualidad full", "Pack 8 clases"
  description text,
  price numeric(10,2) not null,
  billing_cycle text not null check (billing_cycle in ('monthly','quarterly','annual','class_pack','single_session')),
  sessions_included int,                   -- solo si billing_cycle = 'class_pack'
  duration_days int not null,              -- vigencia del plan en días
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on membership_plans (organization_id);

grant select, insert, update, delete on membership_plans to authenticated;
grant select, insert, update, delete on membership_plans to service_role;

alter table membership_plans enable row level security;

-- Todo el staff del club (incluye trainer, para poder ver planes al armar horarios)
-- puede leer los planes de su club.
create policy "membership_plans_select_same_org"
on membership_plans for select
using (
  organization_id in (select private.user_org_ids())
  or private.is_platform_admin()
);

-- Un member (portal) también necesita ver los planes activos de su club para
-- poder elegir uno al pagar/renovar (sección 7 del portal).
create policy "membership_plans_select_member_portal"
on membership_plans for select
using (
  is_active and exists (
    select 1 from members m
    where m.organization_id = membership_plans.organization_id
      and m.user_id = auth.uid()
  )
);

create policy "membership_plans_write_owner_admin"
on membership_plans for insert
with check (private.user_org_role(organization_id) in ('owner','admin'));

create policy "membership_plans_update_owner_admin"
on membership_plans for update
using (private.user_org_role(organization_id) in ('owner','admin'));

create policy "membership_plans_delete_owner_admin"
on membership_plans for delete
using (private.user_org_role(organization_id) in ('owner','admin'));
