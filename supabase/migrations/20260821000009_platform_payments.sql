-- =========================================
-- Fase 6 (módulo 8.11): pagos de la SUSCRIPCIÓN SAAS del club (no confundir
-- con `payments`, que son los pagos de los miembros al club). CLAUDE.md
-- §8.11 deja la decisión abierta ("tabla separada o reutilizando payments
-- ... si hay duda, usar una tabla platform_payments calcada de payments
-- para no mezclar dinero del club con dinero de la plataforma") — se
-- decidió `platform_payments`, la opción que el propio CLAUDE.md sugiere
-- como default cuando hay duda.
-- =========================================

create table platform_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  plan_id uuid not null references subscription_plans(id),
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  method text not null default 'bank_transfer' check (method in ('bank_transfer','other')),
  status text not null default 'pending_review'
    check (status in ('pending_review','approved','rejected')),
  proof_url text,
  reference_number text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index on platform_payments (organization_id);
create index on platform_payments (status);

grant select, insert, update on platform_payments to authenticated;
grant select, insert, update, delete on platform_payments to service_role;

alter table platform_payments enable row level security;

-- Solo el owner de un club ve/registra los pagos de SU suscripción.
create policy "platform_payments_select_owner"
on platform_payments for select
using (
  private.user_org_role(organization_id) = 'owner'
  or private.is_platform_admin()
);

create policy "platform_payments_insert_owner"
on platform_payments for insert
with check (private.user_org_role(organization_id) = 'owner');

-- Solo platform_admin aprueba/rechaza (equivalente de "owner/admin" para
-- pagos de club, pero acá el que cobra es la plataforma).
create policy "platform_payments_update_platform_admin"
on platform_payments for update
using (private.is_platform_admin());

-- =========================================
-- Aprobación (misma idea que approve_payment de Fase 2): extiende
-- organization_subscriptions.current_period_end 1 mes y reactiva el club
-- si estaba 'past_due'/'suspended'.
-- =========================================

create or replace function approve_platform_payment(p_payment_id uuid)
returns void
language plpgsql
as $$
declare
  v_payment platform_payments%rowtype;
begin
  select * into v_payment from platform_payments where id = p_payment_id;
  if not found then
    raise exception 'Pago no encontrado o sin permiso para verlo';
  end if;
  if v_payment.status <> 'pending_review' then
    raise exception 'Este pago ya fue revisado';
  end if;

  -- Solo platform_admin (CLAUDE.md §8.11). Chequeo explícito: un owner SÍ
  -- puede ver su propio pago pendiente (para mostrárselo en su panel) y
  -- SÍ tiene permiso de UPDATE sobre su propia organization_subscriptions/
  -- organizations — sin este chequeo, un owner que llamara esta función
  -- directo aprobaría su propia suscripción sin revisión real (mismo bug
  -- de fondo que en approve_payment: un UPDATE bloqueado por RLS no lanza
  -- excepción, solo afecta 0 filas, y las demás tablas sí lo dejarían pasar).
  if not private.is_platform_admin() then
    raise exception 'No tienes permiso para aprobar este pago.';
  end if;

  update platform_payments
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), paid_at = now()
    where id = p_payment_id;

  update organization_subscriptions
    set plan_id = v_payment.plan_id,
        status = 'active',
        current_period_start = now(),
        current_period_end = greatest(current_period_end, now()) + interval '30 days'
    where organization_id = v_payment.organization_id;

  update organizations set status = 'active' where id = v_payment.organization_id;

  insert into audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (v_payment.organization_id, auth.uid(), 'platform_payment.approved', 'platform_payment', p_payment_id,
    jsonb_build_object('amount', v_payment.amount, 'plan_id', v_payment.plan_id));
end;
$$;

create or replace function reject_platform_payment(p_payment_id uuid)
returns void
language plpgsql
as $$
declare
  v_payment platform_payments%rowtype;
begin
  select * into v_payment from platform_payments where id = p_payment_id;
  if not found then
    raise exception 'Pago no encontrado o sin permiso para verlo';
  end if;
  if v_payment.status <> 'pending_review' then
    raise exception 'Este pago ya fue revisado';
  end if;

  if not private.is_platform_admin() then
    raise exception 'No tienes permiso para rechazar este pago.';
  end if;

  update platform_payments
    set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_payment_id;

  insert into audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (v_payment.organization_id, auth.uid(), 'platform_payment.rejected', 'platform_payment', p_payment_id, null);
end;
$$;

-- CLAUDE.md §6.7: suspensión de club por falta de pago SaaS >7 días. Se
-- llama desde un cron (ver app/api/cron/suspend-organizations/route.ts).
create or replace function suspend_past_due_organizations()
returns integer
language plpgsql
as $$
declare
  v_suspended_count integer;
begin
  -- Paso 1: suscripciones activas cuyo período ya venció pasan a past_due.
  update organization_subscriptions
    set status = 'past_due'
    where status = 'active' and current_period_end < now();

  update organizations
    set status = 'past_due'
    where status = 'active'
      and id in (select organization_id from organization_subscriptions where status = 'past_due');

  -- Paso 2: las que llevan más de 7 días en past_due se suspenden.
  update organizations o
    set status = 'suspended'
    where o.status = 'past_due'
      and exists (
        select 1 from organization_subscriptions os
        where os.organization_id = o.id
          and os.status = 'past_due'
          and os.current_period_end < now() - interval '7 days'
      );

  get diagnostics v_suspended_count = row_count;
  return v_suspended_count;
end;
$$;
