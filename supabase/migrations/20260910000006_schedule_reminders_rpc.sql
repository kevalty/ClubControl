-- Genera automáticamente los 5 recordatorios de pago para una membresía.
-- Se llama desde el server action que crea/aprueba una membresía.
create or replace function schedule_membership_reminders(p_membership_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_membership memberships%rowtype;
  v_due date;
begin
  select * into v_membership from memberships where id = p_membership_id;
  v_due := v_membership.end_date;

  -- Cancelar recordatorios previos del mismo miembro que sigan 'scheduled'
  update payment_reminders
  set status = 'cancelled'
  where member_id = v_membership.member_id
    and status = 'scheduled';

  -- Insertar los 5 recordatorios estándar
  insert into payment_reminders
    (organization_id, member_id, channel, template_key, scheduled_at)
  values
    (v_membership.organization_id, v_membership.member_id, 'whatsapp', 'recordatorio_previo',
      (v_due - interval '3 days')::timestamptz + time '08:00:00' at time zone 'America/Guayaquil'),
    (v_membership.organization_id, v_membership.member_id, 'whatsapp', 'recordatorio_previo',
      v_due::timestamptz + time '08:00:00' at time zone 'America/Guayaquil'),
    (v_membership.organization_id, v_membership.member_id, 'whatsapp', 'recordatorio_vencido',
      (v_due + interval '1 day')::timestamptz + time '08:00:00' at time zone 'America/Guayaquil'),
    (v_membership.organization_id, v_membership.member_id, 'whatsapp', 'recordatorio_vencido',
      (v_due + interval '3 days')::timestamptz + time '08:00:00' at time zone 'America/Guayaquil'),
    (v_membership.organization_id, v_membership.member_id, 'whatsapp', 'recordatorio_vencido',
      (v_due + interval '7 days')::timestamptz + time '08:00:00' at time zone 'America/Guayaquil');
end;
$$;
