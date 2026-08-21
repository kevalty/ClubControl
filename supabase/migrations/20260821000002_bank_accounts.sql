-- =========================================
-- Fase 2 (módulo 8.5, paso 1): cuentas bancarias del club para recibir
-- transferencias. NO está en el esquema de CLAUDE.md §5 (esa sección no
-- modela esta parte de 8.5 en absoluto) — se agrega la tabla más simple y
-- razonable que cumple "el club configura sus cuenta(s) bancaria(s)"
-- (CLAUDE.md instrucción #5: decisión no ambigua, anotada acá).
-- =========================================

create table bank_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  bank_name text not null,
  account_type text not null check (account_type in ('ahorros','corriente')),
  account_number text not null,
  account_holder_name text not null,
  account_holder_document text not null, -- cédula o RUC
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on bank_accounts (organization_id);

grant select, insert, update, delete on bank_accounts to authenticated;
grant select, insert, update, delete on bank_accounts to service_role;

alter table bank_accounts enable row level security;

-- Staff ve las cuentas de su club (para saber a dónde pedirle al miembro
-- que transfiera). Members (portal, Fase 5) también necesitan verlas.
create policy "bank_accounts_select_staff_same_org"
on bank_accounts for select
using (
  organization_id in (select private.user_org_ids())
  or private.is_platform_admin()
);

create policy "bank_accounts_select_member_portal"
on bank_accounts for select
using (
  is_active and exists (
    select 1 from members m
    where m.organization_id = bank_accounts.organization_id
      and m.user_id = auth.uid()
  )
);

create policy "bank_accounts_write_owner_admin"
on bank_accounts for insert
with check (private.user_org_role(organization_id) in ('owner','admin'));

create policy "bank_accounts_update_owner_admin"
on bank_accounts for update
using (private.user_org_role(organization_id) in ('owner','admin'));

create policy "bank_accounts_delete_owner_admin"
on bank_accounts for delete
using (private.user_org_role(organization_id) in ('owner','admin'));
