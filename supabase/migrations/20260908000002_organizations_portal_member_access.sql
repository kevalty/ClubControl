-- Portal members (filas en `members` con user_id = auth.uid()) no estaban
-- incluidos en la policy de SELECT de organizations porque user_org_ids()
-- solo consulta organization_members (staff). Esto causaba que el login de
-- un miembro del portal redirigiera a "/" en vez del portal.

drop policy if exists "organizations_select_member_or_platform_admin" on organizations;

create policy "organizations_select_member_or_platform_admin"
on organizations for select
using (
  -- staff / owner / admin: miembro de organization_members
  id in (select private.user_org_ids())
  -- portal member: usuario vinculado en la tabla members
  or id in (
    select organization_id from members where user_id = auth.uid()
  )
  or private.is_platform_admin()
);
