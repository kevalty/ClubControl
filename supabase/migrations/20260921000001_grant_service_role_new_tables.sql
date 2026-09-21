-- Fix: service_role bypasses RLS but still needs explicit GRANT at the table level.
-- Supabase does not auto-grant service_role on tables created via migrations.
-- The inscripcion flow uses createServiceClient() (service_role key) and was
-- getting "permission denied for table member_medical_info (42501)".
grant select, insert, update, delete on member_medical_info    to service_role;
grant select, insert, update, delete on member_representatives to service_role;
