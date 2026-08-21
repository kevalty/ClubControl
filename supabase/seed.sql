-- Seed de desarrollo local. Ver CLAUDE.md sección 13.
-- Se expande en fases posteriores conforme se agregan tablas de módulos.

insert into subscription_plans (key, name, price_monthly, max_members, max_staff, features, is_active) values
  ('trial', 'Prueba gratuita', 0, 30, 3, '{"whatsapp": true, "clases": true, "reportes": true}', true),
  ('basico', 'Básico', 25, 100, 3, '{"whatsapp": true, "clases": true, "reportes": true}', true),
  ('pro', 'Pro', 45, 300, 8, '{"whatsapp": true, "clases": true, "reportes": true}', true),
  ('ilimitado', 'Ilimitado', 79, null, null, '{"whatsapp": true, "clases": true, "reportes": true}', true);
