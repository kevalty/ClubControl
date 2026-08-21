-- Seed de desarrollo local. Ver CLAUDE.md sección 13.
-- Se expande en fases posteriores conforme se agregan tablas de módulos.

insert into subscription_plans (key, name, price_monthly, max_members, max_staff, features, is_active) values
  ('trial', 'Prueba gratuita', 0, 30, 3, '{"whatsapp": true, "clases": true, "reportes": true}', true),
  ('basico', 'Básico', 25, 100, 3, '{"whatsapp": true, "clases": true, "reportes": true}', true),
  ('pro', 'Pro', 45, 300, 8, '{"whatsapp": true, "clases": true, "reportes": true}', true),
  ('ilimitado', 'Ilimitado', 79, null, null, '{"whatsapp": true, "clases": true, "reportes": true}', true);

-- Plantillas globales por defecto (organization_id null) — cada club puede
-- sobreescribir la suya propia más adelante (módulo 8.6, Fase 3).
insert into whatsapp_templates (organization_id, key, content, is_active) values
  (null, 'bienvenida', 'Hola {{nombre}}, ¡bienvenido/a a {{club}}! Tu registro fue exitoso.', true),
  (null, 'recordatorio_previo', 'Hola {{nombre}}, tu membresía vence el {{fecha_vencimiento}}. Monto a pagar: {{monto}}. {{link_pago}}', true),
  (null, 'recordatorio_vencido', 'Hola {{nombre}}, tu membresía venció el {{fecha_vencimiento}}. Regulariza tu pago para seguir accediendo al club.', true),
  (null, 'confirmacion_pago', 'Hola {{nombre}}, confirmamos tu pago de {{monto}}. ¡Gracias!', true),
  (null, 'comprobante_rechazado', 'Hola {{nombre}}, no pudimos validar tu comprobante de pago. Por favor vuelve a subirlo desde tu portal.', true);
