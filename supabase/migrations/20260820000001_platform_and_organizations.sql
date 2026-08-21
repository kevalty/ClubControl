-- =========================================
-- Fase 0: tablas fundacionales de plataforma y organizaciones
-- Ver CLAUDE.md secciones 5, 11.2, 14 (Fase 0)
-- =========================================

create schema if not exists private;

-- =========================================
-- PLATAFORMA (SaaS) — no pertenece a ningún club
-- =========================================

create table platform_admins (
  id uuid primary key references auth.users(id),
  created_at timestamptz not null default now()
);

create table subscription_plans (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,              -- 'trial', 'basico', 'pro', 'ilimitado'
  name text not null,
  price_monthly numeric(10,2) not null,
  max_members int,                        -- null = ilimitado
  max_staff int,
  features jsonb not null default '{}',   -- {"whatsapp": true, "clases": true, "reportes": true}
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================================
-- ORGANIZACIONES (clubes)
-- =========================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,              -- usado en la URL /[orgSlug]/...
  name text not null,
  logo_url text,
  primary_color text default '#0EA5E9',
  phone text,
  email text,
  address text,
  country text not null default 'EC',
  currency text not null default 'USD',
  timezone text not null default 'America/Guayaquil',
  status text not null default 'trial'    -- trial | active | past_due | suspended | cancelled
    check (status in ('trial','active','past_due','suspended','cancelled')),
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  plan_id uuid not null references subscription_plans(id),
  status text not null default 'trialing'
    check (status in ('trialing','active','past_due','cancelled')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  created_at timestamptz not null default now()
);
create index on organization_subscriptions (organization_id);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','staff','trainer')),
  status text not null default 'active' check (status in ('invited','active','suspended')),
  invited_email text,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index on organization_members (user_id);
create index on organization_members (organization_id);

-- =========================================
-- Funciones auxiliares (security definer) para políticas RLS.
-- Evitan recursión de RLS sobre organization_members y centralizan
-- la lógica de "a qué organizaciones pertenece el usuario actual".
-- =========================================

create or replace function private.is_platform_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (select 1 from platform_admins where id = auth.uid());
$$;

create or replace function private.user_org_ids()
returns setof uuid
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select organization_id from organization_members
  where user_id = auth.uid() and status = 'active';
$$;

create or replace function private.user_org_role(org_id uuid)
returns text
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select role from organization_members
  where user_id = auth.uid() and organization_id = org_id and status = 'active'
  limit 1;
$$;

-- =========================================
-- RLS
-- =========================================

alter table platform_admins enable row level security;
create policy "platform_admins_self_or_admin"
on platform_admins for select
using (id = auth.uid() or private.is_platform_admin());

alter table subscription_plans enable row level security;
create policy "subscription_plans_public_read"
on subscription_plans for select
using (is_active or private.is_platform_admin());
create policy "subscription_plans_platform_admin_write"
on subscription_plans for insert with check (private.is_platform_admin());
create policy "subscription_plans_platform_admin_update"
on subscription_plans for update using (private.is_platform_admin());
create policy "subscription_plans_platform_admin_delete"
on subscription_plans for delete using (private.is_platform_admin());

alter table organizations enable row level security;
create policy "organizations_select_member_or_platform_admin"
on organizations for select
using (id in (select private.user_org_ids()) or private.is_platform_admin());
create policy "organizations_insert_authenticated"
on organizations for insert
with check (auth.uid() is not null);
create policy "organizations_update_owner_or_platform_admin"
on organizations for update
using (
  private.user_org_role(id) = 'owner' or private.is_platform_admin()
);
create policy "organizations_delete_platform_admin"
on organizations for delete
using (private.is_platform_admin());

alter table organization_subscriptions enable row level security;
create policy "org_subscriptions_select_member_or_platform_admin"
on organization_subscriptions for select
using (organization_id in (select private.user_org_ids()) or private.is_platform_admin());
create policy "org_subscriptions_write_owner_or_platform_admin"
on organization_subscriptions for insert
with check (private.user_org_role(organization_id) = 'owner' or private.is_platform_admin());
create policy "org_subscriptions_update_owner_or_platform_admin"
on organization_subscriptions for update
using (private.user_org_role(organization_id) = 'owner' or private.is_platform_admin());

-- Privilegios base a nivel de tabla. RLS filtra FILAS, pero Postgres además
-- exige GRANT a nivel de tabla para el rol "authenticated" (el que usan
-- todos los usuarios logueados vía Supabase Auth); sin esto, RLS nunca
-- llega a evaluarse porque el permiso se deniega antes. `anon` no recibe
-- privilegios: nada en la plataforma es accesible sin sesión.
grant select on platform_admins to authenticated;
grant select on subscription_plans to authenticated;
grant insert, update, delete on subscription_plans to authenticated; -- filtrado por RLS a platform_admin
grant select, insert, update, delete on organizations to authenticated;
grant select, insert, update, delete on organization_subscriptions to authenticated;
grant select, insert, update, delete on organization_members to authenticated;
grant select, insert, update, delete on platform_admins, subscription_plans, organizations, organization_subscriptions, organization_members to service_role;

alter table organization_members enable row level security;
create policy "org_members_select_same_org"
on organization_members for select
using (
  organization_id in (select private.user_org_ids())
  or user_id = auth.uid()
  or private.is_platform_admin()
);
create policy "org_members_insert_owner_admin_or_platform_admin"
on organization_members for insert
with check (
  private.user_org_role(organization_id) in ('owner','admin')
  or private.is_platform_admin()
  -- primer owner de una organización recién creada (no hay filas previas todavía)
  or not exists (select 1 from organization_members om where om.organization_id = organization_members.organization_id)
);
create policy "org_members_update_owner_admin_or_platform_admin"
on organization_members for update
using (
  private.user_org_role(organization_id) in ('owner','admin')
  or private.is_platform_admin()
);
create policy "org_members_delete_owner_or_platform_admin"
on organization_members for delete
using (
  private.user_org_role(organization_id) = 'owner'
  or private.is_platform_admin()
);
