-- Fix F1: family_groups, teams, team_members, class_enrollments were only
-- granted to service_role. Authenticated users (owner/admin) need table-level
-- GRANT for RLS policies to take effect (Supabase does not auto-grant new tables).
grant select, insert, update, delete on family_groups       to authenticated;
grant select, insert, update, delete on family_group_members to authenticated;
grant select, insert, update, delete on teams               to authenticated;
grant select, insert, update, delete on team_members        to authenticated;
grant select, insert, update, delete on class_enrollments   to authenticated;
