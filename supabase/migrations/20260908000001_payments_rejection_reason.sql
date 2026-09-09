-- Agrega campo rejection_reason a payments para que el motivo de rechazo
-- sea visible en la UI sin tener que consultar audit_logs.
alter table payments add column if not exists rejection_reason text;

-- Actualiza reject_payment para almacenar el motivo en la tabla además
-- de en audit_logs.
create or replace function reject_payment(p_payment_id uuid, p_reason text default null)
returns void
language plpgsql
as $$
declare
  v_payment payments%rowtype;
begin
  select * into v_payment from payments where id = p_payment_id;
  if not found then
    raise exception 'Pago no encontrado o sin permiso para verlo';
  end if;
  if v_payment.status <> 'pending_review' then
    raise exception 'Este pago ya fue revisado';
  end if;

  if private.user_org_role(v_payment.organization_id) not in ('owner', 'admin') then
    raise exception 'No tienes permiso para rechazar este pago.';
  end if;

  update payments
    set status = 'rejected',
        rejection_reason = p_reason,
        reviewed_by = auth.uid(),
        reviewed_at = now()
    where id = p_payment_id;

  insert into payment_reminders (organization_id, member_id, payment_id, channel, template_key, scheduled_at, status)
  values (v_payment.organization_id, v_payment.member_id, p_payment_id, 'whatsapp', 'comprobante_rechazado', now(), 'scheduled');

  insert into audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (v_payment.organization_id, auth.uid(), 'payment.rejected', 'payment', p_payment_id,
    jsonb_build_object('reason', p_reason));
end;
$$;
