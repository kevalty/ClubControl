-- =========================================
-- Fase 2 (módulo 8.5): pagos.
-- =========================================

create table payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  membership_id uuid references memberships(id),
  -- plan_id: NO está en el esquema literal de CLAUDE.md §5. Se agrega
  -- porque la regla de negocio §6.3 ("crear O extender la membership") no
  -- es resoluble sin esto: si membership_id es null (primer pago de un
  -- miembro, todavía no tiene ninguna membresía), no hay forma de saber qué
  -- plan comprar al aprobar el pago sin guardar la intención en algún lado.
  -- CLAUDE.md instrucción #5: decisión simple y razonable, anotada acá.
  plan_id uuid references membership_plans(id),
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  method text not null check (method in ('bank_transfer','kushki','payphone','cash','other')),
  status text not null default 'pending_review'
    check (status in ('pending_review','approved','rejected','refunded')),
  proof_url text,                          -- comprobante subido a Storage (transferencia)
  reference_number text,                   -- número de comprobante / transacción
  gateway_transaction_id text,             -- id de Kushki/PayPhone si aplica
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index on payments (organization_id, status);
create index on payments (member_id);

grant select, insert, update on payments to authenticated;
grant select, insert, update, delete on payments to service_role;

alter table payments enable row level security;

create policy "payments_select_staff_same_org"
on payments for select
using (
  organization_id in (select private.user_org_ids())
  or private.is_platform_admin()
);

create policy "payments_select_self"
on payments for select
using (
  exists (
    select 1 from members m
    where m.id = payments.member_id and m.user_id = auth.uid()
  )
);

-- Staff (owner/admin/staff) registra pagos (ej. transferencia recibida,
-- efectivo). El self-service de un member sube su propio comprobante desde
-- el portal — se habilita en Fase 5 con una policy adicional.
create policy "payments_insert_admin_roles"
on payments for insert
with check (private.user_org_role(organization_id) in ('owner','admin','staff'));

-- Solo owner/admin aprueban o rechazan (CLAUDE.md §4: "Solo owner/admin
-- pueden aprobar o rechazar comprobantes de pago"). Esto también significa
-- que staff no puede editar un pago después de crearlo — aceptable para el
-- MVP, no está pedido explícitamente en CLAUDE.md.
create policy "payments_update_owner_admin"
on payments for update
using (private.user_org_role(organization_id) in ('owner','admin'));

-- =========================================
-- Recordatorios y plantillas de WhatsApp (CLAUDE.md §5) — se crean en
-- Fase 2 porque la regla §6.2/6.3/6.4 ya necesita generar/cancelar filas de
-- payment_reminders al aprobar/rechazar un pago, aunque el envío real por
-- WhatsApp (el cron que las procesa) es Fase 3.
-- =========================================

create table whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade, -- null = plantilla global por defecto
  key text not null,          -- 'bienvenida','recordatorio_previo','recordatorio_vencido','confirmacion_pago'
  content text not null,      -- soporta variables {{nombre}}, {{monto}}, {{fecha_vencimiento}}
  is_active boolean not null default true
);
create index on whatsapp_templates (organization_id, key);

grant select, insert, update, delete on whatsapp_templates to authenticated;
grant select, insert, update, delete on whatsapp_templates to service_role;

alter table whatsapp_templates enable row level security;

create policy "whatsapp_templates_select"
on whatsapp_templates for select
using (
  organization_id is null
  or organization_id in (select private.user_org_ids())
  or private.is_platform_admin()
);

create policy "whatsapp_templates_write_owner_admin"
on whatsapp_templates for insert
with check (private.user_org_role(organization_id) in ('owner','admin'));

create policy "whatsapp_templates_update_owner_admin"
on whatsapp_templates for update
using (private.user_org_role(organization_id) in ('owner','admin'));

create policy "whatsapp_templates_delete_owner_admin"
on whatsapp_templates for delete
using (private.user_org_role(organization_id) in ('owner','admin'));

create table payment_reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  payment_id uuid references payments(id),
  channel text not null default 'whatsapp' check (channel in ('whatsapp','email','sms')),
  template_key text not null,
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled','sent','failed','cancelled')),
  error_message text
);
create index on payment_reminders (organization_id, status, scheduled_at);

grant select, insert, update on payment_reminders to authenticated;
grant select, insert, update, delete on payment_reminders to service_role;

alter table payment_reminders enable row level security;

create policy "payment_reminders_select_staff_same_org"
on payment_reminders for select
using (
  organization_id in (select private.user_org_ids())
  or private.is_platform_admin()
);

create policy "payment_reminders_write_admin_roles"
on payment_reminders for insert
with check (private.user_org_role(organization_id) in ('owner','admin','staff'));

create policy "payment_reminders_update_admin_roles"
on payment_reminders for update
using (private.user_org_role(organization_id) in ('owner','admin','staff'));

-- =========================================
-- Funciones de aprobación/rechazo (CLAUDE.md §6.3/§6.4). SECURITY INVOKER
-- (el default): corren con los permisos de quien las llama, así que
-- dependen de que RLS ya le permita a un owner/admin actualizar
-- payments/memberships/members/audit_logs — no hay escalamiento de
-- privilegios acá, es una conveniencia transaccional, no un bypass de RLS.
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

  -- CLAUDE.md §4: solo owner/admin aprueban pagos. Ver la migración
  -- 20260821000004 (versión final de esta función) para la explicación
  -- completa de por qué este chequeo explícito es necesario y no basta
  -- con la policy RLS de UPDATE.
  if private.user_org_role(v_payment.organization_id) not in ('owner', 'admin') then
    raise exception 'No tienes permiso para aprobar este pago.';
  end if;

  if v_payment.membership_id is not null then
    -- Renovación: extiende la membresía existente. Si ya estaba vencida,
    -- extiende desde HOY (no desde la fecha vieja de vencimiento) — es una
    -- simplificación razonable sobre la redacción literal de §6.3 ("end_date
    -- += duration_days"), que dejaría la membresía vencida igual si el
    -- miembro pagó mucho después de que venciera.
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

  update payment_reminders
    set status = 'cancelled'
    where payment_id = p_payment_id and status = 'scheduled';

  -- Confirmación de pago: se agenda para envío inmediato. El job de Fase 3
  -- (cron de WhatsApp) es el que realmente la despacha; hasta que ese cron
  -- exista, queda 'scheduled' sin enviarse (comportamiento esperado, no un bug).
  insert into payment_reminders (organization_id, member_id, payment_id, channel, template_key, scheduled_at, status)
  values (v_payment.organization_id, v_payment.member_id, p_payment_id, 'whatsapp', 'confirmacion_pago', now(), 'scheduled');

  insert into audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (v_payment.organization_id, auth.uid(), 'payment.approved', 'payment', p_payment_id,
    jsonb_build_object('amount', v_payment.amount, 'membership_id', v_membership_id));
end;
$$;

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

  -- CLAUDE.md §4: solo owner/admin. Ver nota en approve_payment sobre por
  -- qué este chequeo explícito hace falta (un UPDATE bloqueado por RLS no
  -- lanza excepción en Postgres, solo afecta 0 filas).
  if private.user_org_role(v_payment.organization_id) not in ('owner', 'admin') then
    raise exception 'No tienes permiso para rechazar este pago.';
  end if;

  update payments
    set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_payment_id;

  insert into payment_reminders (organization_id, member_id, payment_id, channel, template_key, scheduled_at, status)
  values (v_payment.organization_id, v_payment.member_id, p_payment_id, 'whatsapp', 'comprobante_rechazado', now(), 'scheduled');

  insert into audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (v_payment.organization_id, auth.uid(), 'payment.rejected', 'payment', p_payment_id,
    jsonb_build_object('reason', p_reason));
end;
$$;
