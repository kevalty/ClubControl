-- =========================================
-- Auditoría (CLAUDE.md §11.3): toda acción sensible se registra aquí.
-- Se crea en Fase 1 porque el módulo 8.3 (eliminar/editar un miembro) ya
-- es una acción sensible que debe auditarse desde el día uno.
-- =========================================

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  actor_user_id uuid references auth.users(id),
  action text not null,          -- 'payment.approved', 'member.created', etc.
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index on audit_logs (organization_id, created_at desc);

grant select, insert on audit_logs to authenticated;
grant select, insert, update, delete on audit_logs to service_role;

alter table audit_logs enable row level security;

-- Los logs son de solo lectura para staff (owner/admin ven la auditoría de
-- su club); la inserción la hacen las server actions con el usuario logueado
-- como actor, nunca el cliente directamente edita/borra un log.
create policy "audit_logs_select_owner_admin"
on audit_logs for select
using (
  private.user_org_role(organization_id) in ('owner','admin')
  or private.is_platform_admin()
);

create policy "audit_logs_insert_same_org_member"
on audit_logs for insert
with check (
  organization_id in (select private.user_org_ids())
  or private.is_platform_admin()
);
