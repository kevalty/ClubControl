-- Actualiza approve_payment para llamar schedule_membership_reminders
-- automáticamente tras crear o extender una membresía (CLAUDE.md §6.2).
-- Esto garantiza que los 5 recordatorios estándar se generen en la misma
-- transacción que la aprobación del pago, sin depender de lógica en el
-- servidor de Next.js.

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

  -- CLAUDE.md §4: solo owner/admin aprueban pagos.
  if private.user_org_role(v_payment.organization_id) not in ('owner', 'admin') then
    raise exception 'No tienes permiso para aprobar este pago.';
  end if;

  if v_payment.membership_id is not null then
    -- Renovación: extiende la membresía existente.
    select * into v_plan from membership_plans where id =
      (select plan_id from memberships where id = v_payment.membership_id);
    update memberships
      set end_date = greatest(end_date, current_date) + v_plan.duration_days,
          status = 'active'
      where id = v_payment.membership_id;
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

  -- Cancelar recordatorios previos pendientes del pago aprobado.
  update payment_reminders
    set status = 'cancelled'
    where payment_id = p_payment_id and status = 'scheduled';

  -- Programar los 5 recordatorios estándar para la membresía creada/extendida
  -- (CLAUDE.md §6.2): -3 días, día de vencimiento, +1, +3 y +7 días.
  perform schedule_membership_reminders(v_membership_id);

  -- Confirmación de pago: se agenda para envío inmediato.
  insert into payment_reminders (organization_id, member_id, payment_id, channel, template_key, scheduled_at, status)
  values (v_payment.organization_id, v_payment.member_id, p_payment_id, 'whatsapp', 'confirmacion_pago', now(), 'scheduled');

  insert into audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (v_payment.organization_id, auth.uid(), 'payment.approved', 'payment', p_payment_id,
    jsonb_build_object('amount', v_payment.amount, 'membership_id', v_membership_id));
end;
$$;
