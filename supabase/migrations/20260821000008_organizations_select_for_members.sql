-- =========================================
-- Fase 5 (portal del miembro): bug real encontrado al probar el portal
-- end-to-end. La policy de SELECT de `organizations` (creada en Fase 0)
-- solo dejaba ver el club a quien tuviera una fila en organization_members
-- (staff) — un member de portal (sin fila en organization_members) no
-- podía leer ni siquiera el nombre de su propio club, lo cual rompía TODO
-- el portal: tanto el lookup directo (lib/portal/get-current-member.ts)
-- como cualquier join embebido `organizations(...)` desde `members`
-- (PostgREST filtra el objeto embebido a null si RLS no lo deja ver, en
-- vez de dar error — el síntoma fue "no encuentra ningún club" en el
-- selector post-login, no un error explícito).
-- =========================================

create policy "organizations_select_own_as_member"
on organizations for select
using (
  exists (
    select 1 from members m
    where m.organization_id = organizations.id and m.user_id = auth.uid()
  )
);
