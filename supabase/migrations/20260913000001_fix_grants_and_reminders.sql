-- Fix 1: GRANT explícito a authenticated en las 5 tablas nuevas del plan FENIX.
-- En versiones recientes de Supabase, las tablas creadas por migración no heredan
-- los privilegios del schema automáticamente — se necesita el GRANT por tabla.
grant select, insert, update, delete on fee_types            to authenticated;
grant select, insert, update, delete on locations             to authenticated;
grant select, insert, update, delete on member_medical_info   to authenticated;
grant select, insert, update, delete on member_representatives to authenticated;
grant select, insert, update, delete on sim_invoices          to authenticated;

-- Fix 2: schedule_membership_reminders — reemplaza `time '08:00:00'` (no operable
-- con timestamptz) por `interval '8 hours'` con AT TIME ZONE para obtener las 8am
-- hora Ecuador correctas como timestamptz.
create or replace function schedule_membership_reminders(p_membership_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_membership memberships%rowtype;
  v_due        date;
begin
  select * into v_membership from memberships where id = p_membership_id;
  v_due := v_membership.end_date;

  -- Cancelar recordatorios previos del mismo miembro que sigan 'scheduled'
  update payment_reminders
  set status = 'cancelled'
  where member_id = v_membership.member_id
    and status    = 'scheduled';

  -- Insertar los 5 recordatorios estándar a las 08:00 hora Guayaquil.
  -- Patrón: (fecha::timestamp + interval '8 hours') AT TIME ZONE 'America/Guayaquil'
  -- interpreta el timestamp como hora local y lo convierte a UTC (devuelve timestamptz).
  insert into payment_reminders
    (organization_id, member_id, channel, template_key, scheduled_at)
  values
    (v_membership.organization_id, v_membership.member_id, 'whatsapp', 'recordatorio_previo',
      ((v_due - interval '3 days')::timestamp + interval '8 hours') at time zone 'America/Guayaquil'),
    (v_membership.organization_id, v_membership.member_id, 'whatsapp', 'recordatorio_previo',
      (v_due::timestamp + interval '8 hours') at time zone 'America/Guayaquil'),
    (v_membership.organization_id, v_membership.member_id, 'whatsapp', 'recordatorio_vencido',
      ((v_due + interval '1 day')::timestamp + interval '8 hours') at time zone 'America/Guayaquil'),
    (v_membership.organization_id, v_membership.member_id, 'whatsapp', 'recordatorio_vencido',
      ((v_due + interval '3 days')::timestamp + interval '8 hours') at time zone 'America/Guayaquil'),
    (v_membership.organization_id, v_membership.member_id, 'whatsapp', 'recordatorio_vencido',
      ((v_due + interval '7 days')::timestamp + interval '8 hours') at time zone 'America/Guayaquil');
end;
$$;
