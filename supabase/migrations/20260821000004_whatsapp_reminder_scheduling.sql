-- =========================================
-- Fase 3 (módulo 8.6): al aprobar un pago (crear/extender una membresía),
-- CLAUDE.md §6.2 pide agendar recordatorios en estos momentos relativos al
-- nuevo end_date: 3 días antes, el día del vencimiento, y 1/3/7 días
-- después (si para entonces sigue sin pago aprobado — ese chequeo se hace
-- en el cron de envío de Fase 3, no acá, revisando member.status).
-- Se reemplaza approve_payment (creada en Fase 2) agregando ese bloque.
-- =========================================

create or replace function approve_payment(p_payment_id uuid)
returns void
language plpgsql
as $$
declare
  v_payment payments%rowtype;
  v_plan membership_plans%rowtype;
  v_membership_id uuid;
  v_new_end_date date;
begin
  select * into v_payment from payments where id = p_payment_id;
  if not found then
    raise exception 'Pago no encontrado o sin permiso para verlo';
  end if;
  if v_payment.status <> 'pending_review' then
    raise exception 'Este pago ya fue revisado';
  end if;

  if v_payment.membership_id is not null then
    select * into v_plan from membership_plans where id =
      (select plan_id from memberships where id = v_payment.membership_id);
    update memberships
      set end_date = greatest(end_date, current_date) + v_plan.duration_days,
          status = 'active'
      where id = v_payment.membership_id
      returning end_date into v_new_end_date;
    v_membership_id := v_payment.membership_id;
  else
    if v_payment.plan_id is null then
      raise exception 'El pago no tiene un plan asociado, no se puede crear la membresía';
    end if;
    select * into v_plan from membership_plans where id = v_payment.plan_id;
    v_new_end_date := current_date + v_plan.duration_days;
    insert into memberships (organization_id, member_id, plan_id, start_date, end_date, status)
    values (v_payment.organization_id, v_payment.member_id, v_plan.id, current_date, v_new_end_date, 'active')
    returning id into v_membership_id;
  end if;

  update payments
    set status = 'approved',
        membership_id = v_membership_id,
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        paid_at = now()
    where id = p_payment_id;

  update members set status = 'active' where id = v_payment.member_id;

  -- Cancela cualquier recordatorio de vencimiento pendiente de la
  -- membresía anterior (ya no aplica, se acaba de renovar) y el propio
  -- payment_id si tuviera alguno agendado.
  update payment_reminders
    set status = 'cancelled'
    where member_id = v_payment.member_id
      and status = 'scheduled'
      and template_key in ('recordatorio_previo', 'recordatorio_vencido');

  insert into payment_reminders (organization_id, member_id, payment_id, channel, template_key, scheduled_at, status)
  values (v_payment.organization_id, v_payment.member_id, p_payment_id, 'whatsapp', 'confirmacion_pago', now(), 'scheduled');

  -- Agenda los recordatorios de la nueva vigencia (CLAUDE.md §6.2).
  insert into payment_reminders (organization_id, member_id, channel, template_key, scheduled_at, status)
  values
    (v_payment.organization_id, v_payment.member_id, 'whatsapp', 'recordatorio_previo', (v_new_end_date - 3)::timestamptz, 'scheduled'),
    (v_payment.organization_id, v_payment.member_id, 'whatsapp', 'recordatorio_previo', v_new_end_date::timestamptz, 'scheduled'),
    (v_payment.organization_id, v_payment.member_id, 'whatsapp', 'recordatorio_vencido', (v_new_end_date + 1)::timestamptz, 'scheduled'),
    (v_payment.organization_id, v_payment.member_id, 'whatsapp', 'recordatorio_vencido', (v_new_end_date + 3)::timestamptz, 'scheduled'),
    (v_payment.organization_id, v_payment.member_id, 'whatsapp', 'recordatorio_vencido', (v_new_end_date + 7)::timestamptz, 'scheduled');

  insert into audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (v_payment.organization_id, auth.uid(), 'payment.approved', 'payment', p_payment_id,
    jsonb_build_object('amount', v_payment.amount, 'membership_id', v_membership_id));
end;
$$;
