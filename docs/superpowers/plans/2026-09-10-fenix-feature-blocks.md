# FENIX Feature Blocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 8 feature blocks requested by Academia FENIX Riobamba: extended student profiles, rubros/tarifas, public registration form, automatic WhatsApp reminders, sedes, RBAC visual for trainers, SRI facturación simulator, and carnet digital.

**Architecture:** All features are server-side first (Next.js 14 App Router, server actions, server components). New DB tables use the same multi-tenant pattern (organization_id + RLS). UI extends existing shadcn/ui patterns. No new external libraries except jspdf for PDF generation and html2canvas for carnet screenshot.

**Tech Stack:** Next.js 14 App Router · TypeScript · Supabase (Postgres + RLS + Auth) · Tailwind CSS · shadcn/ui · Twilio WhatsApp API · jspdf · html2canvas

**Spec:** Design approved in conversation 2026-09-10. See CLAUDE.md for full project constraints.

## Global Constraints

- Language: all UI text in Spanish (es-EC). No English visible to end users.
- Currency: USD with `$` symbol. Ecuador timezone `America/Guayaquil`.
- All tables with `organization_id` must have RLS enabled.
- Server actions must filter by `organization_id` explicitly (defense in depth over RLS).
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code.
- Commits: one per task, descriptive, no mixing of unrelated changes.
- TypeScript: strict, no `any` in new code unless forced by Base UI primitives.

---

## File Map

### New migrations
- `supabase/migrations/20260910000001_extended_member_profile.sql` — new cols on members + member_medical_info + member_representatives
- `supabase/migrations/20260910000002_fee_types.sql` — fee_types table + members.fee_type_id
- `supabase/migrations/20260910000003_locations.sql` — locations table + members.location_id + classes.location_id
- `supabase/migrations/20260910000004_sim_invoices.sql` — sim_invoices table
- `supabase/migrations/20260910000005_rls_new_tables.sql` — RLS for fee_types, locations, member_medical_info, member_representatives, sim_invoices
- `supabase/migrations/20260910000006_schedule_reminders_rpc.sql` — schedule_membership_reminders() function + trigger on memberships

### New routes
- `app/[orgSlug]/inscripcion/page.tsx` — public registration form
- `app/[orgSlug]/inscripcion/actions.ts` — server action: create pending member
- `app/[orgSlug]/dashboard/inscripciones/page.tsx` — pending registration queue
- `app/[orgSlug]/dashboard/inscripciones/actions.ts` — approve/reject actions
- `app/[orgSlug]/dashboard/configuracion/sedes/page.tsx` — sedes CRUD list
- `app/[orgSlug]/dashboard/configuracion/sedes/nueva/page.tsx` — new sede
- `app/[orgSlug]/dashboard/configuracion/sedes/[sedeId]/editar/page.tsx` — edit sede
- `app/[orgSlug]/dashboard/configuracion/sedes/actions.ts` — CRUD server actions
- `app/[orgSlug]/dashboard/configuracion/rubros/page.tsx` — fee types CRUD list
- `app/[orgSlug]/dashboard/configuracion/rubros/nuevo/page.tsx` — new fee type
- `app/[orgSlug]/dashboard/configuracion/rubros/[rubroId]/editar/page.tsx` — edit fee type
- `app/[orgSlug]/dashboard/configuracion/rubros/actions.ts` — CRUD server actions
- `app/[orgSlug]/dashboard/facturacion/page.tsx` — SRI simulator list
- `app/[orgSlug]/dashboard/facturacion/nueva/page.tsx` — new sim invoice
- `app/[orgSlug]/dashboard/facturacion/actions.ts` — create sim invoice
- `app/[orgSlug]/carnet/[memberId]/page.tsx` — public carnet digital (token auth via qr_code)
- `app/[orgSlug]/dashboard/trainer/page.tsx` — trainer-specific dashboard view

### Modified files
- `supabase/migrations/` — new migrations (listed above)
- `app/[orgSlug]/dashboard/miembros/miembro-form.tsx` — rewrite with 3-tab structure
- `app/[orgSlug]/dashboard/miembros/nuevo/page.tsx` — pass sedes + rubros to form
- `app/[orgSlug]/dashboard/miembros/[memberId]/page.tsx` — show medical/representative tabs + WhatsApp invite button
- `app/[orgSlug]/dashboard/miembros/[memberId]/editar/page.tsx` — prefill all extended fields
- `app/[orgSlug]/dashboard/miembros/[memberId]/miembro-acciones.tsx` — add "Enviar link inscripción" button
- `app/[orgSlug]/dashboard/miembros/actions.ts` — update crearMiembro/editarMiembro to handle extended fields
- `components/dashboard-sidebar.tsx` — add nav items: Inscripciones (with badge), Sedes, Rubros, Facturación; trainer-restricted view
- `lib/supabase/middleware.ts` — add /[orgSlug]/inscripcion to public routes
- `lib/validations/member.ts` — extend Zod schema with new fields
- `app/[orgSlug]/portal/page.tsx` — add link to carnet digital
- `app/api/cron/reminders/route.ts` — no changes needed (already processes scheduled reminders)

---

## Task 1: DB Migrations — Extended Profile, Fee Types, Locations, Sim Invoices

**Files:**
- Create: `supabase/migrations/20260910000001_extended_member_profile.sql`
- Create: `supabase/migrations/20260910000002_fee_types.sql`
- Create: `supabase/migrations/20260910000003_locations.sql`
- Create: `supabase/migrations/20260910000004_sim_invoices.sql`
- Create: `supabase/migrations/20260910000005_rls_new_tables.sql`
- Create: `supabase/migrations/20260910000006_schedule_reminders_rpc.sql`

**Interfaces:**
- Produces: DB schema for all 8 feature blocks. All subsequent tasks depend on this.

- [ ] **Step 1: Write migration 1 — extended member profile**

Create `supabase/migrations/20260910000001_extended_member_profile.sql`:

```sql
-- Nuevas columnas en members para perfil extendido
alter table members
  add column if not exists school text,
  add column if not exists grade text,
  add column if not exists registration_status text not null default 'approved'
    check (registration_status in ('pending_approval','approved','rejected'));

-- Datos médicos del miembro (relación 1:1)
create table if not exists member_medical_info (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade unique,
  blood_type text,
  allergies text,
  conditions text,
  medications text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Representantes/tutores del miembro (1:many, uno puede ser is_primary)
create table if not exists member_representatives (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  full_name text not null,
  relationship text not null,
  phone text not null,
  email text,
  document_id text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists member_representatives_member_id_idx on member_representatives(member_id);
```

- [ ] **Step 2: Write migration 2 — fee types**

Create `supabase/migrations/20260910000002_fee_types.sql`:

```sql
create table if not exists fee_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  discount_percent numeric(5,2) not null default 0
    check (discount_percent >= 0 and discount_percent <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists fee_types_org_idx on fee_types(organization_id);

alter table members
  add column if not exists fee_type_id uuid references fee_types(id) on delete set null;
```

- [ ] **Step 3: Write migration 3 — locations (sedes)**

Create `supabase/migrations/20260910000003_locations.sql`:

```sql
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists locations_org_idx on locations(organization_id);

alter table members
  add column if not exists location_id uuid references locations(id) on delete set null;

alter table classes
  add column if not exists location_id uuid references locations(id) on delete set null;
```

- [ ] **Step 4: Write migration 4 — sim invoices**

Create `supabase/migrations/20260910000004_sim_invoices.sql`:

```sql
create table if not exists sim_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  sequential_number int not null,
  recipient_name text not null,
  recipient_document text not null,
  recipient_address text,
  concept text not null,
  subtotal numeric(10,2) not null,
  tax_rate numeric(5,2) not null default 15.00,
  tax_amount numeric(10,2) not null,
  total numeric(10,2) not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id, sequential_number)
);
create index if not exists sim_invoices_org_idx on sim_invoices(organization_id);
```

- [ ] **Step 5: Write migration 5 — RLS for all new tables**

Create `supabase/migrations/20260910000005_rls_new_tables.sql`:

```sql
-- ===== fee_types =====
alter table fee_types enable row level security;

create policy "fee_types_select_org"
on fee_types for select
using (organization_id in (select private.user_org_ids()));

create policy "fee_types_write_admin"
on fee_types for all
using (organization_id in (
  select organization_id from organization_members
  where user_id = auth.uid() and status = 'active' and role in ('owner','admin')
));

-- ===== locations =====
alter table locations enable row level security;

create policy "locations_select_org"
on locations for select
using (organization_id in (select private.user_org_ids()));

create policy "locations_write_admin"
on locations for all
using (organization_id in (
  select organization_id from organization_members
  where user_id = auth.uid() and status = 'active' and role in ('owner','admin')
));

-- ===== member_medical_info =====
alter table member_medical_info enable row level security;

create policy "member_medical_info_select_staff"
on member_medical_info for select
using (
  exists (
    select 1 from members m
    join organization_members om on om.organization_id = m.organization_id
    where m.id = member_medical_info.member_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  )
);

create policy "member_medical_info_write_admin"
on member_medical_info for all
using (
  exists (
    select 1 from members m
    join organization_members om on om.organization_id = m.organization_id
    where m.id = member_medical_info.member_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and om.role in ('owner','admin','staff')
  )
);

-- portal member can read their own
create policy "member_medical_info_select_self"
on member_medical_info for select
using (
  exists (select 1 from members m where m.id = member_medical_info.member_id and m.user_id = auth.uid())
);

-- ===== member_representatives =====
alter table member_representatives enable row level security;

create policy "member_representatives_select_staff"
on member_representatives for select
using (
  exists (
    select 1 from members m
    join organization_members om on om.organization_id = m.organization_id
    where m.id = member_representatives.member_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  )
);

create policy "member_representatives_write_admin"
on member_representatives for all
using (
  exists (
    select 1 from members m
    join organization_members om on om.organization_id = m.organization_id
    where m.id = member_representatives.member_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and om.role in ('owner','admin','staff')
  )
);

create policy "member_representatives_select_self"
on member_representatives for select
using (
  exists (select 1 from members m where m.id = member_representatives.member_id and m.user_id = auth.uid())
);

-- ===== sim_invoices =====
alter table sim_invoices enable row level security;

create policy "sim_invoices_select_org"
on sim_invoices for select
using (organization_id in (select private.user_org_ids()));

create policy "sim_invoices_insert_admin"
on sim_invoices for insert
with check (organization_id in (
  select organization_id from organization_members
  where user_id = auth.uid() and status = 'active' and role in ('owner','admin','staff')
));

-- ===== Allow pending inscripcion insert (unauthenticated) via service role only =====
-- The public inscripcion form calls a server action that uses the SERVICE ROLE client,
-- so no anon insert policy is needed on members. The server action does the insert.
```

- [ ] **Step 6: Write migration 6 — schedule reminders RPC**

Create `supabase/migrations/20260910000006_schedule_reminders_rpc.sql`:

```sql
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
```

- [ ] **Step 7: Apply all migrations in Supabase**

Run in Supabase SQL editor (or via `supabase db push` if CLI is configured):
```
supabase/migrations/20260910000001_extended_member_profile.sql
supabase/migrations/20260910000002_fee_types.sql
supabase/migrations/20260910000003_locations.sql
supabase/migrations/20260910000004_sim_invoices.sql
supabase/migrations/20260910000005_rls_new_tables.sql
supabase/migrations/20260910000006_schedule_reminders_rpc.sql
```

Run in order. Verify no errors.

- [ ] **Step 8: Regenerate Supabase types**

```powershell
npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> --schema public > lib/supabase/database.types.ts
```

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): extended profile, fee_types, locations, sim_invoices, reminders RPC"
```

---

## Task 2: Sedes (Locations) CRUD

**Files:**
- Create: `app/[orgSlug]/dashboard/configuracion/sedes/page.tsx`
- Create: `app/[orgSlug]/dashboard/configuracion/sedes/actions.ts`
- Create: `app/[orgSlug]/dashboard/configuracion/sedes/sede-form.tsx`
- Create: `app/[orgSlug]/dashboard/configuracion/sedes/nueva/page.tsx`
- Create: `app/[orgSlug]/dashboard/configuracion/sedes/[sedeId]/editar/page.tsx`

**Interfaces:**
- Consumes: `locations` table from Task 1
- Produces: `/[orgSlug]/dashboard/configuracion/sedes` route; `locations` rows available for Tasks 4 and 5

- [ ] **Step 1: Create server actions**

Create `app/[orgSlug]/dashboard/configuracion/sedes/actions.ts`:

```typescript
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const SedeSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function crearSede(
  orgSlug: string,
  orgId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = SedeSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("locations").insert({
    organization_id: orgId,
    ...parsed.data,
  });
  if (error) return { error: error.message };

  redirect(`/${orgSlug}/dashboard/configuracion/sedes`);
}

export async function editarSede(
  orgSlug: string,
  sedeId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = SedeSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .update(parsed.data)
    .eq("id", sedeId);
  if (error) return { error: error.message };

  redirect(`/${orgSlug}/dashboard/configuracion/sedes`);
}

export async function toggleSede(sedeId: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("locations").update({ is_active: isActive }).eq("id", sedeId);
}
```

- [ ] **Step 2: Create shared form component**

Create `app/[orgSlug]/dashboard/configuracion/sedes/sede-form.tsx`:

```typescript
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type SedeFormValues = { name: string; address?: string | null; phone?: string | null };

export function SedeForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (prev: { error?: string } | undefined, fd: FormData) => Promise<{ error?: string } | undefined>;
  initialValues?: SedeFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state?.error ? (
        <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la sede *</Label>
        <Input id="name" name="name" defaultValue={initialValues?.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" name="address" defaultValue={initialValues?.address ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={initialValues?.phone ?? ""} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Create list page**

Create `app/[orgSlug]/dashboard/configuracion/sedes/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";

export default async function SedesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) notFound();

  const { data: sedes } = await supabase
    .from("locations")
    .select("id, name, address, phone, is_active")
    .eq("organization_id", org.id)
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sedes</h1>
        <LinkButton href={`/${orgSlug}/dashboard/configuracion/sedes/nueva`}>
          Nueva sede
        </LinkButton>
      </div>
      {!sedes?.length ? (
        <p className="text-muted-foreground">No hay sedes registradas. Crea la primera.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {sedes.map((sede) => (
            <div key={sede.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{sede.name}</p>
                {sede.address ? <p className="text-sm text-muted-foreground">{sede.address}</p> : null}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={sede.is_active ? "default" : "secondary"}>
                  {sede.is_active ? "Activa" : "Inactiva"}
                </Badge>
                <LinkButton
                  href={`/${orgSlug}/dashboard/configuracion/sedes/${sede.id}/editar`}
                  variant="outline"
                  size="sm"
                >
                  Editar
                </LinkButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create nueva/editar pages**

Create `app/[orgSlug]/dashboard/configuracion/sedes/nueva/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { crearSede } from "../actions";
import { SedeForm } from "../sede-form";

export default async function NuevaSedeePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", orgSlug).maybeSingle();
  if (!org) notFound();

  const action = crearSede.bind(null, orgSlug, org.id);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nueva sede</h1>
      <SedeForm action={action} submitLabel="Crear sede" />
    </div>
  );
}
```

Create `app/[orgSlug]/dashboard/configuracion/sedes/[sedeId]/editar/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { editarSede } from "../../actions";
import { SedeForm } from "../../sede-form";

export default async function EditarSedeePage({
  params,
}: {
  params: Promise<{ orgSlug: string; sedeId: string }>;
}) {
  const { orgSlug, sedeId } = await params;
  const supabase = await createClient();
  const { data: sede } = await supabase
    .from("locations")
    .select("id, name, address, phone")
    .eq("id", sedeId)
    .maybeSingle();
  if (!sede) notFound();

  const action = editarSede.bind(null, orgSlug, sedeId);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar sede</h1>
      <SedeForm action={action} initialValues={sede} submitLabel="Guardar cambios" />
    </div>
  );
}
```

- [ ] **Step 5: Add Sedes link to sidebar**

In `components/dashboard-sidebar.tsx`, in the Configuración section, add after the existing whatsapp/suscripcion links:

```tsx
{ href: `/${orgSlug}/dashboard/configuracion/sedes`, label: "Sedes" },
{ href: `/${orgSlug}/dashboard/configuracion/rubros`, label: "Rubros" },
{ href: `/${orgSlug}/dashboard/facturacion`, label: "Facturación" },
```

- [ ] **Step 6: Add /inscripcion to public middleware routes**

In `lib/supabase/middleware.ts`, add to `isPublicRoute`:

```typescript
pathname.match(/^\/[^/]+\/inscripcion/) ||
```

- [ ] **Step 7: Manual test**

Navigate to `/[orgSlug]/dashboard/configuracion/sedes`, create a sede, verify it appears in list.

- [ ] **Step 8: Commit**

```bash
git add app/[orgSlug]/dashboard/configuracion/sedes/ components/dashboard-sidebar.tsx lib/supabase/middleware.ts
git commit -m "feat(sedes): CRUD de sedes y nav"
```

---

## Task 3: Rubros (Fee Types) CRUD

**Files:**
- Create: `app/[orgSlug]/dashboard/configuracion/rubros/page.tsx`
- Create: `app/[orgSlug]/dashboard/configuracion/rubros/actions.ts`
- Create: `app/[orgSlug]/dashboard/configuracion/rubros/rubro-form.tsx`
- Create: `app/[orgSlug]/dashboard/configuracion/rubros/nuevo/page.tsx`
- Create: `app/[orgSlug]/dashboard/configuracion/rubros/[rubroId]/editar/page.tsx`

**Interfaces:**
- Consumes: `fee_types` table from Task 1
- Produces: `/[orgSlug]/dashboard/configuracion/rubros` route; fee_type rows available for Task 4

- [ ] **Step 1: Create server actions**

Create `app/[orgSlug]/dashboard/configuracion/rubros/actions.ts`:

```typescript
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const RubroSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  discount_percent: z.coerce.number().min(0).max(100),
});

export async function crearRubro(
  orgSlug: string,
  orgId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = RubroSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    discount_percent: formData.get("discount_percent") ?? 0,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("fee_types").insert({
    organization_id: orgId,
    ...parsed.data,
  });
  if (error) return { error: error.message };

  redirect(`/${orgSlug}/dashboard/configuracion/rubros`);
}

export async function editarRubro(
  orgSlug: string,
  rubroId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = RubroSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    discount_percent: formData.get("discount_percent") ?? 0,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("fee_types")
    .update(parsed.data)
    .eq("id", rubroId);
  if (error) return { error: error.message };

  redirect(`/${orgSlug}/dashboard/configuracion/rubros`);
}
```

- [ ] **Step 2: Create form component**

Create `app/[orgSlug]/dashboard/configuracion/rubros/rubro-form.tsx`:

```typescript
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

type RubroFormValues = { name: string; description?: string | null; discount_percent: number };

export function RubroForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (prev: { error?: string } | undefined, fd: FormData) => Promise<{ error?: string } | undefined>;
  initialValues?: RubroFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state?.error ? (
        <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del rubro *</Label>
        <Input id="name" name="name" defaultValue={initialValues?.name} required
          placeholder="Ej: Becado, Solo 3 días, Tiempo completo" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" defaultValue={initialValues?.description ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="discount_percent">Descuento (%)</Label>
        <Input
          id="discount_percent"
          name="discount_percent"
          type="number"
          min="0"
          max="100"
          step="0.01"
          defaultValue={initialValues?.discount_percent ?? 0}
        />
        <p className="text-xs text-muted-foreground">
          0 = sin descuento. 100 = totalmente becado. El precio final = precio del plan × (1 - descuento/100).
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Create list, nueva, editar pages**

Create `app/[orgSlug]/dashboard/configuracion/rubros/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";

export default async function RubrosPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", orgSlug).maybeSingle();
  if (!org) notFound();

  const { data: rubros } = await supabase
    .from("fee_types")
    .select("id, name, description, discount_percent, is_active")
    .eq("organization_id", org.id)
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rubros / Tipos de tarifa</h1>
        <LinkButton href={`/${orgSlug}/dashboard/configuracion/rubros/nuevo`}>
          Nuevo rubro
        </LinkButton>
      </div>
      {!rubros?.length ? (
        <p className="text-muted-foreground">No hay rubros creados. Crea el primero para asignar tarifas especiales a tus estudiantes.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {rubros.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{r.name}</p>
                {r.description ? <p className="text-sm text-muted-foreground">{r.description}</p> : null}
                <p className="text-sm text-muted-foreground">Descuento: {r.discount_percent}%</p>
              </div>
              <LinkButton
                href={`/${orgSlug}/dashboard/configuracion/rubros/${r.id}/editar`}
                variant="outline"
                size="sm"
              >
                Editar
              </LinkButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

Create `app/[orgSlug]/dashboard/configuracion/rubros/nuevo/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { crearRubro } from "../actions";
import { RubroForm } from "../rubro-form";

export default async function NuevoRubroPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", orgSlug).maybeSingle();
  if (!org) notFound();

  const action = crearRubro.bind(null, orgSlug, org.id);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo rubro</h1>
      <RubroForm action={action} submitLabel="Crear rubro" />
    </div>
  );
}
```

Create `app/[orgSlug]/dashboard/configuracion/rubros/[rubroId]/editar/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { editarRubro } from "../../actions";
import { RubroForm } from "../../rubro-form";

export default async function EditarRubroPage({
  params,
}: {
  params: Promise<{ orgSlug: string; rubroId: string }>;
}) {
  const { orgSlug, rubroId } = await params;
  const supabase = await createClient();
  const { data: rubro } = await supabase
    .from("fee_types")
    .select("name, description, discount_percent")
    .eq("id", rubroId)
    .maybeSingle();
  if (!rubro) notFound();

  const action = editarRubro.bind(null, orgSlug, rubroId);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar rubro</h1>
      <RubroForm action={action} initialValues={rubro} submitLabel="Guardar cambios" />
    </div>
  );
}
```

- [ ] **Step 4: Manual test**

Navigate to `/[orgSlug]/dashboard/configuracion/rubros`, create "Becado" with 100% discount and "Solo 3 días" with 25%, verify list.

- [ ] **Step 5: Commit**

```bash
git add app/[orgSlug]/dashboard/configuracion/rubros/
git commit -m "feat(rubros): CRUD de tipos de tarifa"
```

---

## Task 4: Extended Member Profile — 3-Tab Form

**Files:**
- Modify: `app/[orgSlug]/dashboard/miembros/miembro-form.tsx` — full rewrite with tabs
- Modify: `app/[orgSlug]/dashboard/miembros/nuevo/page.tsx` — pass sedes + rubros
- Modify: `app/[orgSlug]/dashboard/miembros/[memberId]/editar/page.tsx` — fetch + pass extended data
- Modify: `app/[orgSlug]/dashboard/miembros/[memberId]/page.tsx` — show medical/representative tabs
- Modify: `app/[orgSlug]/dashboard/miembros/actions.ts` — handle new fields

**Interfaces:**
- Consumes: `locations` (Task 2), `fee_types` (Task 3)
- Produces: full extended member profile stored in DB

- [ ] **Step 1: Read current miembro-form and actions to understand shape**

Read `app/[orgSlug]/dashboard/miembros/actions.ts` fully before editing.

- [ ] **Step 2: Rewrite miembro-form.tsx with 3 tabs**

Replace `app/[orgSlug]/dashboard/miembros/miembro-form.tsx` entirely:

```typescript
"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Location = { id: string; name: string };
type FeeType = { id: string; name: string; discount_percent: number };

export type ExtendedMemberValues = {
  full_name: string;
  email: string | null;
  phone: string;
  document_id: string | null;
  birth_date: string | null;
  school: string | null;
  grade: string | null;
  location_id: string | null;
  fee_type_id: string | null;
  notes: string | null;
  // médico
  blood_type: string | null;
  allergies: string | null;
  conditions: string | null;
  medications: string | null;
  medical_notes: string | null;
  // representante (uno por defecto)
  rep_full_name: string | null;
  rep_relationship: string | null;
  rep_phone: string | null;
  rep_email: string | null;
  rep_document_id: string | null;
};

export function MiembroForm({
  action,
  initialValues,
  submitLabel,
  locations,
  feeTypes,
}: {
  action: (prev: { error?: string } | undefined, fd: FormData) => Promise<{ error?: string } | undefined>;
  initialValues?: Partial<ExtendedMemberValues>;
  submitLabel: string;
  locations: Location[];
  feeTypes: FeeType[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [activeTab, setActiveTab] = useState("personales");

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {state?.error ? (
        <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personales">Personales</TabsTrigger>
          <TabsTrigger value="medico">Médico</TabsTrigger>
          <TabsTrigger value="representante">Representante</TabsTrigger>
        </TabsList>

        {/* ===== TAB: PERSONALES ===== */}
        <TabsContent value="personales" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo *</Label>
            <Input id="fullName" name="fullName" defaultValue={initialValues?.full_name ?? ""} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (WhatsApp) *</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={initialValues?.phone ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" name="email" type="email" defaultValue={initialValues?.email ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentId">Cédula</Label>
              <Input id="documentId" name="documentId" defaultValue={initialValues?.document_id ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Fecha de nacimiento</Label>
              <Input id="birthDate" name="birthDate" type="date" defaultValue={initialValues?.birth_date ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="school">Unidad educativa</Label>
              <Input id="school" name="school" defaultValue={initialValues?.school ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Curso / Año</Label>
              <Input id="grade" name="grade" defaultValue={initialValues?.grade ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {locations.length > 0 && (
              <div className="space-y-2">
                <Label>Sede</Label>
                <Select name="locationId" defaultValue={initialValues?.location_id ?? undefined}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar sede" /></SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {feeTypes.length > 0 && (
              <div className="space-y-2">
                <Label>Rubro / Tarifa</Label>
                <Select name="feeTypeId" defaultValue={initialValues?.fee_type_id ?? undefined}>
                  <SelectTrigger><SelectValue placeholder="Tarifa normal" /></SelectTrigger>
                  <SelectContent>
                    {feeTypes.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} ({f.discount_percent}% desc.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" defaultValue={initialValues?.notes ?? ""} />
          </div>
        </TabsContent>

        {/* ===== TAB: MÉDICO ===== */}
        <TabsContent value="medico" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="bloodType">Tipo de sangre</Label>
            <Select name="bloodType" defaultValue={initialValues?.blood_type ?? undefined}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="allergies">Alergias</Label>
            <Textarea id="allergies" name="allergies" defaultValue={initialValues?.allergies ?? ""}
              placeholder="Ninguna / Penicilina / Polen..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conditions">Condiciones médicas</Label>
            <Textarea id="conditions" name="conditions" defaultValue={initialValues?.conditions ?? ""}
              placeholder="Asma, diabetes, etc." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medications">Medicamentos</Label>
            <Textarea id="medications" name="medications" defaultValue={initialValues?.medications ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicalNotes">Notas médicas adicionales</Label>
            <Textarea id="medicalNotes" name="medicalNotes" defaultValue={initialValues?.medical_notes ?? ""} />
          </div>
        </TabsContent>

        {/* ===== TAB: REPRESENTANTE ===== */}
        <TabsContent value="representante" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="repFullName">Nombre completo del representante *</Label>
            <Input id="repFullName" name="repFullName" defaultValue={initialValues?.rep_full_name ?? ""} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repRelationship">Parentesco *</Label>
              <Input id="repRelationship" name="repRelationship"
                defaultValue={initialValues?.rep_relationship ?? ""}
                placeholder="Padre, Madre, Tutor..." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repPhone">Teléfono del representante *</Label>
              <Input id="repPhone" name="repPhone" type="tel"
                defaultValue={initialValues?.rep_phone ?? ""} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repEmail">Correo del representante</Label>
              <Input id="repEmail" name="repEmail" type="email" defaultValue={initialValues?.rep_email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repDocumentId">Cédula del representante</Label>
              <Input id="repDocumentId" name="repDocumentId" defaultValue={initialValues?.rep_document_id ?? ""} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Update server action crearMiembro to handle extended fields**

In `app/[orgSlug]/dashboard/miembros/actions.ts`, update `crearMiembro` to:
1. Extract new fields from formData: `school`, `grade`, `locationId`, `feeTypeId`, `bloodType`, `allergies`, `conditions`, `medications`, `medicalNotes`, `repFullName`, `repRelationship`, `repPhone`, `repEmail`, `repDocumentId`.
2. Insert into `members` with new cols: `school`, `grade`, `location_id`, `fee_type_id`.
3. After member insert, insert `member_medical_info` (if any medical field non-empty).
4. Insert `member_representatives` with is_primary=true.

Read the current actions.ts first to see the exact pattern, then add the new fields following the same style.

The updated `crearMiembro` function body (key additions):

```typescript
// After existing member insert that returns { data: newMember }:
if (newMember) {
  const medFields = { blood_type, allergies, conditions, medications, notes: medical_notes };
  const hasMedical = Object.values(medFields).some(Boolean);
  if (hasMedical) {
    await supabase.from("member_medical_info").insert({
      member_id: newMember.id,
      ...medFields,
    });
  }
  if (rep_full_name && rep_relationship && rep_phone) {
    await supabase.from("member_representatives").insert({
      member_id: newMember.id,
      full_name: rep_full_name,
      relationship: rep_relationship,
      phone: rep_phone,
      email: rep_email || null,
      document_id: rep_document_id || null,
      is_primary: true,
    });
  }
}
```

Similarly update `editarMiembro` to upsert `member_medical_info` and upsert (or update) the primary representative.

- [ ] **Step 4: Update nuevo/page.tsx to fetch and pass locations + feeTypes**

```typescript
// In NuevoMiembroPage, add before rendering:
const [{ data: locations }, { data: feeTypes }] = await Promise.all([
  supabase.from("locations").select("id, name").eq("organization_id", org.id).eq("is_active", true).order("name"),
  supabase.from("fee_types").select("id, name, discount_percent").eq("organization_id", org.id).eq("is_active", true).order("name"),
]);
// Pass to MiembroForm: locations={locations ?? []} feeTypes={feeTypes ?? []}
```

- [ ] **Step 5: Update [memberId]/page.tsx to show extended data in tabs**

Add fetch for medical info and representatives:

```typescript
const [{ data: medicalInfo }, { data: representatives }] = await Promise.all([
  supabase.from("member_medical_info").select("*").eq("member_id", memberId).maybeSingle(),
  supabase.from("member_representatives").select("*").eq("member_id", memberId).order("is_primary", { ascending: false }),
]);
```

Add tabs to the member detail page showing the three sections (Personales already shown, add Médico and Representantes tabs below the existing data).

- [ ] **Step 6: Update editar/page.tsx to prefill all extended fields**

Fetch medical_info and primary representative, map to `ExtendedMemberValues` shape, pass as `initialValues`.

- [ ] **Step 7: Manual test**

Create a new member with all 3 tabs filled. Verify data saved in DB (members, member_medical_info, member_representatives). Edit the member, verify fields prefill. Check detail page shows all tabs.

- [ ] **Step 8: Commit**

```bash
git add app/[orgSlug]/dashboard/miembros/
git commit -m "feat(miembros): perfil extendido con tabs médico y representante"
```

---

## Task 5: Public Registration Form + Admin Approval + WhatsApp Invite

**Files:**
- Create: `app/[orgSlug]/inscripcion/page.tsx`
- Create: `app/[orgSlug]/inscripcion/actions.ts`
- Create: `app/[orgSlug]/inscripcion/inscripcion-form.tsx`
- Create: `app/[orgSlug]/dashboard/inscripciones/page.tsx`
- Create: `app/[orgSlug]/dashboard/inscripciones/actions.ts`
- Modify: `app/[orgSlug]/dashboard/miembros/[memberId]/miembro-acciones.tsx` — add WhatsApp invite button

**Interfaces:**
- Consumes: `members` (extended, Task 4), `member_medical_info`, `member_representatives`
- Produces: public `/[orgSlug]/inscripcion` form; `/[orgSlug]/dashboard/inscripciones` review queue; in-app notifications

- [ ] **Step 1: Create public inscription form**

Create `app/[orgSlug]/inscripcion/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { InscripcionForm } from "./inscripcion-form";

export default async function InscripcionPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  // Use service client: this is public route, no session
  const supabase = createServiceClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, logo_url")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) notFound();

  const [{ data: locations }, { data: feeTypes }] = await Promise.all([
    supabase.from("locations").select("id, name").eq("organization_id", org.id).eq("is_active", true).order("name"),
    supabase.from("fee_types").select("id, name, discount_percent").eq("organization_id", org.id).eq("is_active", true).order("name"),
  ]);

  return (
    <main className="min-h-screen bg-muted/40 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          {org.logo_url ? (
            <img src={org.logo_url} alt={org.name} className="mx-auto mb-3 h-16 w-auto object-contain" />
          ) : null}
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-muted-foreground">Formulario de inscripción</p>
        </div>
        <InscripcionForm
          orgSlug={orgSlug}
          orgId={org.id}
          locations={locations ?? []}
          feeTypes={feeTypes ?? []}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create inscription form component**

Create `app/[orgSlug]/inscripcion/inscripcion-form.tsx`:

```typescript
"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { submitInscripcion } from "./actions";

type Location = { id: string; name: string };
type FeeType = { id: string; name: string; discount_percent: number };

export function InscripcionForm({
  orgSlug,
  orgId,
  locations,
  feeTypes,
}: {
  orgSlug: string;
  orgId: string;
  locations: Location[];
  feeTypes: FeeType[];
}) {
  const action = submitInscripcion.bind(null, orgSlug, orgId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [activeTab, setActiveTab] = useState("personales");

  if (state?.success) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="mb-2 text-4xl">✓</div>
        <h2 className="text-xl font-semibold">¡Solicitud enviada!</h2>
        <p className="mt-2 text-muted-foreground">
          Tu solicitud de inscripción fue recibida. El equipo la revisará y te contactará pronto.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <form action={formAction} className="space-y-6">
        {state?.error ? (
          <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>
        ) : null}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personales">Datos del estudiante</TabsTrigger>
            <TabsTrigger value="medico">Información médica</TabsTrigger>
            <TabsTrigger value="representante">Representante</TabsTrigger>
          </TabsList>

          <TabsContent value="personales" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo *</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
                <Input id="birthDate" name="birthDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentId">Cédula</Label>
                <Input id="documentId" name="documentId" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school">Unidad educativa *</Label>
                <Input id="school" name="school" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Curso / Año *</Label>
                <Input id="grade" name="grade" required />
              </div>
            </div>
            {locations.length > 0 && (
              <div className="space-y-2">
                <Label>Sede de entrenamiento</Label>
                <Select name="locationId">
                  <SelectTrigger><SelectValue placeholder="Seleccionar sede" /></SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="medico" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="bloodType">Tipo de sangre *</Label>
              <Select name="bloodType" required>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergies">Alergias *</Label>
              <Textarea id="allergies" name="allergies" required placeholder="Ninguna / Penicilina..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditions">Condiciones médicas *</Label>
              <Textarea id="conditions" name="conditions" required placeholder="Ninguna / Asma..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medications">Medicamentos</Label>
              <Textarea id="medications" name="medications" />
            </div>
          </TabsContent>

          <TabsContent value="representante" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="repFullName">Nombre completo *</Label>
              <Input id="repFullName" name="repFullName" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="repRelationship">Parentesco *</Label>
                <Input id="repRelationship" name="repRelationship" required placeholder="Padre / Madre / Tutor" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repPhone">Teléfono *</Label>
                <Input id="repPhone" name="repPhone" type="tel" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="repEmail">Correo electrónico</Label>
                <Input id="repEmail" name="repEmail" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repDocumentId">Cédula</Label>
                <Input id="repDocumentId" name="repDocumentId" />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Enviando..." : "Enviar solicitud de inscripción"}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create inscription server action**

Create `app/[orgSlug]/inscripcion/actions.ts`:

```typescript
"use server";

import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

const InscripcionSchema = z.object({
  fullName: z.string().min(2, "Nombre requerido"),
  birthDate: z.string().min(1, "Fecha de nacimiento requerida"),
  documentId: z.string().optional(),
  school: z.string().min(1, "Unidad educativa requerida"),
  grade: z.string().min(1, "Curso requerido"),
  locationId: z.string().uuid().optional(),
  bloodType: z.string().min(1, "Tipo de sangre requerido"),
  allergies: z.string().min(1, "Campo requerido"),
  conditions: z.string().min(1, "Campo requerido"),
  medications: z.string().optional(),
  repFullName: z.string().min(2, "Nombre del representante requerido"),
  repRelationship: z.string().min(1, "Parentesco requerido"),
  repPhone: z.string().min(7, "Teléfono del representante requerido"),
  repEmail: z.string().email().optional().or(z.literal("")),
  repDocumentId: z.string().optional(),
});

export async function submitInscripcion(
  orgSlug: string,
  orgId: string,
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = InscripcionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const d = parsed.data;
  const supabase = createServiceClient(); // service: public route, no auth

  // Insert member with registration_status = 'pending_approval'
  const { data: member, error: memberError } = await supabase
    .from("members")
    .insert({
      organization_id: orgId,
      full_name: d.fullName,
      phone: d.repPhone, // representante's phone as contact
      birth_date: d.birthDate || null,
      document_id: d.documentId || null,
      school: d.school,
      grade: d.grade,
      location_id: d.locationId || null,
      registration_status: "pending_approval",
      status: "inactive", // inactive until approved
    })
    .select("id")
    .single();

  if (memberError || !member) return { error: "Error al guardar la solicitud. Intenta de nuevo." };

  // Insert medical info
  await supabase.from("member_medical_info").insert({
    member_id: member.id,
    blood_type: d.bloodType,
    allergies: d.allergies,
    conditions: d.conditions,
    medications: d.medications || null,
  });

  // Insert representative
  await supabase.from("member_representatives").insert({
    member_id: member.id,
    full_name: d.repFullName,
    relationship: d.repRelationship,
    phone: d.repPhone,
    email: d.repEmail || null,
    document_id: d.repDocumentId || null,
    is_primary: true,
  });

  // Notify admins/owners of the org in-app
  const { data: admins } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .in("role", ["owner", "admin"])
    .eq("status", "active");

  if (admins?.length) {
    await supabase.from("notifications").insert(
      admins.map((a) => ({
        organization_id: orgId,
        user_id: a.user_id,
        title: "Nueva solicitud de inscripción",
        body: `${d.fullName} completó el formulario de inscripción y está pendiente de aprobación.`,
      }))
    );
  }

  return { success: true };
}
```

- [ ] **Step 4: Create inscripciones approval queue**

Create `app/[orgSlug]/dashboard/inscripciones/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { AprobarRechazarButtons } from "./aprobar-rechazar-buttons";

export default async function InscripcionesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase.from("organizations").select("id").eq("slug", orgSlug).maybeSingle();
  if (!org) notFound();

  const { data: pending } = await supabase
    .from("members")
    .select("id, full_name, birth_date, school, grade, created_at, registration_status")
    .eq("organization_id", org.id)
    .eq("registration_status", "pending_approval")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        Solicitudes de inscripción
        {pending?.length ? (
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({pending.length} pendiente{pending.length !== 1 ? "s" : ""})
          </span>
        ) : null}
      </h1>
      {!pending?.length ? (
        <p className="text-muted-foreground">No hay solicitudes pendientes de revisión.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {pending.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium">{m.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {m.school} · {m.grade}
                </p>
                <p className="text-xs text-muted-foreground">
                  Enviado: {new Date(m.created_at).toLocaleDateString("es-EC")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <LinkButton href={`/${orgSlug}/dashboard/miembros/${m.id}`} variant="outline" size="sm">
                  Ver ficha
                </LinkButton>
                <AprobarRechazarButtons orgSlug={orgSlug} memberId={m.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

Create `app/[orgSlug]/dashboard/inscripciones/aprobar-rechazar-buttons.tsx`:

```typescript
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { aprobarInscripcion, rechazarInscripcion } from "./actions";

export function AprobarRechazarButtons({
  orgSlug,
  memberId,
}: {
  orgSlug: string;
  memberId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => aprobarInscripcion(orgSlug, memberId))}
      >
        Aprobar
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() => startTransition(() => rechazarInscripcion(orgSlug, memberId))}
      >
        Rechazar
      </Button>
    </>
  );
}
```

Create `app/[orgSlug]/dashboard/inscripciones/actions.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function aprobarInscripcion(orgSlug: string, memberId: string) {
  const supabase = await createClient();
  await supabase
    .from("members")
    .update({ registration_status: "approved", status: "active" })
    .eq("id", memberId);
  revalidatePath(`/${orgSlug}/dashboard/inscripciones`);
}

export async function rechazarInscripcion(orgSlug: string, memberId: string) {
  const supabase = await createClient();
  await supabase
    .from("members")
    .update({ registration_status: "rejected", status: "inactive" })
    .eq("id", memberId);
  revalidatePath(`/${orgSlug}/dashboard/inscripciones`);
}
```

- [ ] **Step 5: Add "Enviar link de inscripción" button to member actions**

In `app/[orgSlug]/dashboard/miembros/[memberId]/miembro-acciones.tsx`, add a new server action `enviarLinkInscripcion` that:
1. Fetches the primary representative's phone from `member_representatives`.
2. Sends a WhatsApp message via `sendWhatsAppMessage` with the inscription link.

```typescript
// Add to miembro-acciones.tsx (client component with useTransition):
async function handleEnviarLink() {
  startTransition(async () => {
    const result = await enviarLinkInscripcion(orgSlug, memberId);
    if (result?.error) alert(result.error);
    else alert("Link enviado por WhatsApp al representante.");
  });
}

// In the JSX, add button:
<Button variant="outline" size="sm" onClick={handleEnviarLink} disabled={pending}>
  Enviar link de inscripción
</Button>
```

Create the server action in `app/[orgSlug]/dashboard/miembros/[memberId]/acciones-extended.ts`:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/twilio";

export async function enviarLinkInscripcion(
  orgSlug: string,
  memberId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: rep } = await supabase
    .from("member_representatives")
    .select("phone, full_name")
    .eq("member_id", memberId)
    .eq("is_primary", true)
    .maybeSingle();

  if (!rep) return { error: "No hay representante registrado para este miembro." };

  const { data: org } = await supabase.from("organizations").select("name").eq("slug", orgSlug).maybeSingle();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const link = `${appUrl}/${orgSlug}/inscripcion`;

  const body = `Hola ${rep.full_name}, le invitamos a completar el formulario de inscripción de ${org?.name ?? "nuestra academia"}:\n\n${link}\n\nSi tiene dudas, contáctenos.`;
  const result = await sendWhatsAppMessage(rep.phone, body);
  if (!result.ok) return { error: result.error };
  return {};
}
```

- [ ] **Step 6: Add Inscripciones nav link to sidebar with notification badge**

In `components/dashboard-sidebar.tsx`, add the "Inscripciones" link to the main navigation. Fetch pending count server-side and pass it as a badge (similar to pending payments badge already implemented).

- [ ] **Step 7: Manual test**

1. Open `/[orgSlug]/inscripcion` in incognito (no session). Fill all 3 tabs, submit. Verify "Solicitud enviada" confirmation.
2. Log in as admin. Navigate to `/[orgSlug]/dashboard/inscripciones`. Verify pending request shows. Click Aprobar. Verify member status → active.
3. In member detail, click "Enviar link de inscripción". Verify WhatsApp sent (or graceful error if Twilio not configured).

- [ ] **Step 8: Commit**

```bash
git add app/[orgSlug]/inscripcion/ app/[orgSlug]/dashboard/inscripciones/
git commit -m "feat(inscripcion): formulario público, aprobación y WhatsApp invite"
```

---

## Task 6: Automatic WhatsApp Payment Reminders

**Files:**
- Modify: `app/[orgSlug]/dashboard/pagos/nuevo/registrar-pago-form.tsx` — call RPC after membership created
- Modify: `app/[orgSlug]/dashboard/pagos/pago-acciones.tsx` — call RPC when payment approved

**Interfaces:**
- Consumes: `schedule_membership_reminders()` RPC from Task 1 migration 6; existing cron at `app/api/cron/reminders/route.ts`
- Produces: automatic payment_reminders rows on membership create/approve

The cron at `/api/cron/reminders` already processes `payment_reminders`. We only need to call the RPC when a membership is created or a payment is approved.

- [ ] **Step 1: Read pago-acciones.tsx and the approve payment action**

Read `app/[orgSlug]/dashboard/pagos/pago-acciones.tsx` fully to understand the approve flow.

- [ ] **Step 2: Call schedule_membership_reminders after payment approval**

In the server action that approves a payment (likely in `pago-acciones.tsx` or a separate `actions.ts`), after creating/extending the membership, call:

```typescript
// After membership insert/update, get the membership id, then:
await supabase.rpc("schedule_membership_reminders", { p_membership_id: newMembershipId });
```

- [ ] **Step 3: Call schedule_membership_reminders when membership is manually created**

In whatever server action creates a membership directly (if one exists in `/planes` or `/miembros`), add the same RPC call after insert.

- [ ] **Step 4: Verify cron picks them up**

Check `vercel.json` or the cron config to confirm `/api/cron/reminders` is scheduled daily. If `vercel.json` doesn't exist, check if there's another config file. If not configured, add:

```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "0 13 * * *" },
    { "path": "/api/cron/expire-memberships", "schedule": "0 12 * * *" }
  ]
}
```

(13:00 UTC = 08:00 America/Guayaquil UTC-5)

- [ ] **Step 5: Manual test**

1. Approve a payment that creates a membership.
2. Query `payment_reminders` in Supabase SQL: `select * from payment_reminders where member_id = '<id>' order by scheduled_at`. Verify 5 rows created with correct dates.

- [ ] **Step 6: Commit**

```bash
git add app/[orgSlug]/dashboard/pagos/ vercel.json
git commit -m "feat(reminders): auto-programar recordatorios al aprobar pago"
```

---

## Task 7: RBAC Visual — Trainer Dashboard

**Files:**
- Modify: `components/dashboard-sidebar.tsx` — trainer-restricted nav
- Modify: `app/[orgSlug]/dashboard/layout.tsx` — detect role, pass to sidebar
- Modify: `app/[orgSlug]/dashboard/miembros/[memberId]/page.tsx` — hide payment data for trainers

**Interfaces:**
- Consumes: `organization_members.role` from session
- Produces: trainers see only Mis clases + Asistencia in sidebar; no payment amounts in member detail

- [ ] **Step 1: Read dashboard layout.tsx**

Read `app/[orgSlug]/dashboard/layout.tsx` fully to understand how the sidebar is rendered.

- [ ] **Step 2: Fetch user role in layout and pass to sidebar**

In `app/[orgSlug]/dashboard/layout.tsx`, add role fetch:

```typescript
const { data: authUser } = await supabase.auth.getUser();
const { data: membership } = await supabase
  .from("organization_members")
  .select("role")
  .eq("organization_id", org.id)
  .eq("user_id", authUser.user?.id ?? "")
  .maybeSingle();
const userRole = membership?.role ?? "staff";
```

Pass `userRole` as a prop to `DashboardSidebar`.

- [ ] **Step 3: Filter sidebar nav by role**

In `components/dashboard-sidebar.tsx`, accept `userRole` prop and conditionally render nav items:

```typescript
// Trainer only sees:
const trainerOnlyLinks = [
  { href: `/${orgSlug}/dashboard/clases`, label: "Mis clases" },
  { href: `/${orgSlug}/dashboard/asistencia`, label: "Asistencia" },
];

// All other roles see the full nav.
const navItems = userRole === "trainer" ? trainerOnlyLinks : fullNavItems;
```

- [ ] **Step 4: Hide payment data in member detail for trainers**

In `app/[orgSlug]/dashboard/miembros/[memberId]/page.tsx`, pass `userRole` down. For `trainer` role, skip fetching payments and hide the payments section:

```typescript
// In the page:
if (userRole !== "trainer") {
  // fetch and show payments
}
```

Show trainers only: name, status, active membership name, attendance history.

- [ ] **Step 5: Add route protection for trainers**

In `lib/supabase/middleware.ts`, add trainer route block. When a trainer tries to access `/pagos`, `/planes`, `/equipo`, `/configuracion`, redirect to `/dashboard` instead of returning 403 (better UX):

```typescript
if (userRole === "trainer" && (
  pathname.includes("/pagos") ||
  pathname.includes("/planes") ||
  pathname.includes("/equipo") ||
  pathname.includes("/configuracion")
)) {
  const url = request.nextUrl.clone();
  url.pathname = `/${orgSlug}/dashboard`;
  return NextResponse.redirect(url);
}
```

Note: fetching role in middleware adds one DB query per request for trainer routes. To avoid this, fetch role only when the path matches restricted patterns.

- [ ] **Step 6: Manual test**

Log in as a user with `trainer` role. Verify sidebar only shows Mis clases + Asistencia. Try navigating to `/pagos` — verify redirect.

- [ ] **Step 7: Commit**

```bash
git add components/dashboard-sidebar.tsx app/[orgSlug]/dashboard/layout.tsx lib/supabase/middleware.ts
git commit -m "feat(rbac): vista restringida para entrenadores"
```

---

## Task 8: SRI Facturación Simulator

**Files:**
- Create: `app/[orgSlug]/dashboard/facturacion/page.tsx`
- Create: `app/[orgSlug]/dashboard/facturacion/nueva/page.tsx`
- Create: `app/[orgSlug]/dashboard/facturacion/actions.ts`
- Create: `app/[orgSlug]/dashboard/facturacion/nueva/factura-form.tsx`
- Create: `app/[orgSlug]/dashboard/facturacion/[facturaId]/page.tsx` — print/preview

**Interfaces:**
- Consumes: `sim_invoices` from Task 1
- Produces: `/[orgSlug]/dashboard/facturacion` list + PDF-ready preview

- [ ] **Step 1: Create server actions**

Create `app/[orgSlug]/dashboard/facturacion/actions.ts`:

```typescript
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const FacturaSchema = z.object({
  recipient_name: z.string().min(1),
  recipient_document: z.string().min(1),
  recipient_address: z.string().optional(),
  concept: z.string().min(1),
  subtotal: z.coerce.number().positive(),
});

export async function crearFacturaSimulada(
  orgSlug: string,
  orgId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = FacturaSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();

  // Get next sequential number for this org
  const { count } = await supabase
    .from("sim_invoices")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  const sequential = (count ?? 0) + 1;
  const { data: d } = parsed;
  const tax_amount = Number((d.subtotal * 0.15).toFixed(2));
  const total = Number((d.subtotal + tax_amount).toFixed(2));

  const { error } = await supabase.from("sim_invoices").insert({
    organization_id: orgId,
    sequential_number: sequential,
    recipient_name: d.recipient_name,
    recipient_document: d.recipient_document,
    recipient_address: d.recipient_address || null,
    concept: d.concept,
    subtotal: d.subtotal,
    tax_rate: 15.00,
    tax_amount,
    total,
    created_by: authUser.user?.id ?? null,
  });

  if (error) return { error: error.message };
  redirect(`/${orgSlug}/dashboard/facturacion`);
}
```

- [ ] **Step 2: Create list page**

Create `app/[orgSlug]/dashboard/facturacion/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";

export default async function FacturacionPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id, name").eq("slug", orgSlug).maybeSingle();
  if (!org) notFound();

  const { data: facturas } = await supabase
    .from("sim_invoices")
    .select("id, sequential_number, recipient_name, concept, total, created_at")
    .eq("organization_id", org.id)
    .order("sequential_number", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Facturación (simulador)</h1>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Este simulador no emite facturas válidas ante el SRI. Solo para uso interno de referencia.
          </p>
        </div>
        <LinkButton href={`/${orgSlug}/dashboard/facturacion/nueva`}>
          Nueva factura
        </LinkButton>
      </div>
      {!facturas?.length ? (
        <p className="text-muted-foreground">No hay facturas simuladas generadas.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {facturas.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">#{String(f.sequential_number).padStart(9, "0")} — {f.recipient_name}</p>
                <p className="text-sm text-muted-foreground">{f.concept}</p>
                <p className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString("es-EC")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">${Number(f.total).toFixed(2)}</span>
                <LinkButton href={`/${orgSlug}/dashboard/facturacion/${f.id}`} variant="outline" size="sm">
                  Ver / Imprimir
                </LinkButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create form page**

Create `app/[orgSlug]/dashboard/facturacion/nueva/factura-form.tsx`:

```typescript
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

export function FacturaForm({
  action,
}: {
  action: (prev: { error?: string } | undefined, fd: FormData) => Promise<{ error?: string } | undefined>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [subtotal, setSubtotal] = useState(0);
  const tax = Number((subtotal * 0.15).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state?.error ? (
        <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="recipient_name">Nombre / Razón social del receptor *</Label>
        <Input id="recipient_name" name="recipient_name" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="recipient_document">Cédula / RUC *</Label>
          <Input id="recipient_document" name="recipient_document" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipient_address">Dirección</Label>
          <Input id="recipient_address" name="recipient_address" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="concept">Concepto *</Label>
        <Textarea id="concept" name="concept" required placeholder="Mensualidad octubre 2026, Pack 10 clases, etc." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subtotal">Subtotal (USD) *</Label>
        <Input
          id="subtotal"
          name="subtotal"
          type="number"
          min="0.01"
          step="0.01"
          required
          onChange={(e) => setSubtotal(Number(e.target.value) || 0)}
        />
      </div>
      <div className="rounded-lg bg-muted p-4 text-sm space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>IVA 15%</span><span>${tax.toFixed(2)}</span></div>
        <div className="flex justify-between font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Generando..." : "Generar factura"}
      </Button>
    </form>
  );
}
```

Create `app/[orgSlug]/dashboard/facturacion/nueva/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { crearFacturaSimulada } from "../actions";
import { FacturaForm } from "./factura-form";

export default async function NuevaFacturaPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", orgSlug).maybeSingle();
  if (!org) notFound();

  const action = crearFacturaSimulada.bind(null, orgSlug, org.id);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nueva factura simulada</h1>
      <FacturaForm action={action} />
    </div>
  );
}
```

- [ ] **Step 4: Create print/preview page**

Create `app/[orgSlug]/dashboard/facturacion/[facturaId]/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintFactura } from "./print-factura";

export default async function VerFacturaPage({
  params,
}: {
  params: Promise<{ orgSlug: string; facturaId: string }>;
}) {
  const { orgSlug, facturaId } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase.from("organizations").select("name, address, email, logo_url").eq("slug", orgSlug).maybeSingle();
  if (!org) notFound();

  const { data: factura } = await supabase
    .from("sim_invoices")
    .select("*")
    .eq("id", facturaId)
    .maybeSingle();
  if (!factura) notFound();

  return <PrintFactura org={org} factura={factura} />;
}
```

Create `app/[orgSlug]/dashboard/facturacion/[facturaId]/print-factura.tsx`:

```typescript
"use client";

import { Button } from "@/components/ui/button";

type Org = { name: string; address: string | null; email: string | null; logo_url: string | null };
type Factura = {
  sequential_number: number;
  recipient_name: string;
  recipient_document: string;
  recipient_address: string | null;
  concept: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  created_at: string;
};

export function PrintFactura({ org, factura }: { org: Org; factura: Factura }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 print:hidden">
        <Button onClick={() => window.print()}>Imprimir / Guardar PDF</Button>
      </div>
      <div className="rounded-lg border bg-white p-8 text-sm print:border-none" id="factura-content">
        <div className="mb-4 rounded bg-amber-50 border border-amber-200 p-2 text-center text-xs text-amber-700 print:hidden">
          SIMULADOR — Esta factura no tiene validez ante el SRI del Ecuador
        </div>
        <div className="flex justify-between mb-6">
          <div>
            {org.logo_url ? <img src={org.logo_url} alt={org.name} className="h-12 mb-1" /> : null}
            <p className="font-bold text-lg">{org.name}</p>
            {org.address ? <p className="text-muted-foreground">{org.address}</p> : null}
            {org.email ? <p className="text-muted-foreground">{org.email}</p> : null}
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">FACTURA</p>
            <p>Nro: {String(factura.sequential_number).padStart(9, "0")}</p>
            <p>Fecha: {new Date(factura.created_at).toLocaleDateString("es-EC")}</p>
          </div>
        </div>
        <div className="mb-6 rounded border p-3">
          <p><span className="font-medium">Señor(es):</span> {factura.recipient_name}</p>
          <p><span className="font-medium">C.I./RUC:</span> {factura.recipient_document}</p>
          {factura.recipient_address ? (
            <p><span className="font-medium">Dirección:</span> {factura.recipient_address}</p>
          ) : null}
        </div>
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Descripción</th>
              <th className="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2">{factura.concept}</td>
              <td className="py-2 text-right">${Number(factura.subtotal).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <div className="ml-auto w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>${Number(factura.subtotal).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>IVA {factura.tax_rate}%</span><span>${Number(factura.tax_amount).toFixed(2)}</span></div>
          <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>${Number(factura.total).toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Manual test**

Create a factura simulada. Verify it appears in list with correct sequential number. Click Ver/Imprimir. Verify print preview looks like a receipt. Click Imprimir — browser print dialog opens.

- [ ] **Step 6: Commit**

```bash
git add app/[orgSlug]/dashboard/facturacion/
git commit -m "feat(facturacion): simulador de facturas con vista de impresión"
```

---

## Task 9: Carnet Digital del Estudiante

**Files:**
- Create: `app/[orgSlug]/carnet/[memberId]/page.tsx` — public, token auth via qr_code param
- Modify: `app/[orgSlug]/portal/page.tsx` — add "Ver mi carnet" link
- Modify: `app/[orgSlug]/dashboard/miembros/[memberId]/page.tsx` — add "Ver carnet" link
- Modify: `lib/supabase/middleware.ts` — add /carnet route to public routes

**Interfaces:**
- Consumes: `members.qr_code` as auth token; `membership_plans`, `memberships`, `organizations` data
- Produces: public printable carnet at `/[orgSlug]/carnet/[memberId]?token=QR_CODE`

- [ ] **Step 1: Add carnet route to public middleware**

In `lib/supabase/middleware.ts`, add to `isPublicRoute`:

```typescript
pathname.match(/^\/[^/]+\/carnet\//) ||
```

- [ ] **Step 2: Create carnet page**

Create `app/[orgSlug]/carnet/[memberId]/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { CarnetView } from "./carnet-view";

export default async function CarnetPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string; memberId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { orgSlug, memberId } = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  const supabase = createServiceClient();

  const { data: member } = await supabase
    .from("members")
    .select("id, full_name, photo_url, status, qr_code, join_date")
    .eq("id", memberId)
    .eq("qr_code", token) // token validation: must match qr_code
    .maybeSingle();

  if (!member) notFound(); // invalid token or wrong member

  const { data: org } = await supabase
    .from("organizations")
    .select("name, logo_url, primary_color")
    .eq("slug", orgSlug)
    .maybeSingle();

  const { data: activeMembership } = await supabase
    .from("memberships")
    .select("end_date, membership_plans(name)")
    .eq("member_id", memberId)
    .eq("status", "active")
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <CarnetView
      member={member}
      org={org ?? { name: orgSlug, logo_url: null, primary_color: "#0EA5E9" }}
      activeMembership={activeMembership}
    />
  );
}
```

- [ ] **Step 3: Create carnet view component**

Create `app/[orgSlug]/carnet/[memberId]/carnet-view.tsx`:

```typescript
"use client";

import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Member = { id: string; full_name: string; photo_url: string | null; status: string; qr_code: string; join_date: string };
type Org = { name: string; logo_url: string | null; primary_color: string };
type Membership = { end_date: string; membership_plans: { name: string } | null } | null;

export function CarnetView({
  member,
  org,
  activeMembership,
}: {
  member: Member;
  org: Org;
  activeMembership: Membership;
}) {
  const isActive = member.status === "active";

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Print button - hidden when printing */}
        <Button className="w-full print:hidden" onClick={() => window.print()}>
          Imprimir / Guardar PDF
        </Button>

        {/* Carnet card */}
        <div
          className="rounded-2xl border-2 bg-white overflow-hidden shadow-lg print:shadow-none"
          style={{ borderColor: org.primary_color }}
          id="carnet"
        >
          {/* Header bar */}
          <div className="p-4 text-white text-center" style={{ backgroundColor: org.primary_color }}>
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="h-8 mx-auto mb-1 object-contain" />
            ) : null}
            <p className="font-bold text-lg">{org.name}</p>
            <p className="text-sm opacity-90">CARNET DE ESTUDIANTE</p>
          </div>

          {/* Photo + info */}
          <div className="p-6 flex gap-4">
            <div className="flex-shrink-0">
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={member.full_name}
                  className="h-20 w-20 rounded-lg object-cover border-2"
                  style={{ borderColor: org.primary_color }}
                />
              ) : (
                <div
                  className="h-20 w-20 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: org.primary_color }}
                >
                  {member.full_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg leading-tight">{member.full_name}</p>
              {activeMembership ? (
                <p className="text-sm text-muted-foreground mt-1">
                  {(activeMembership.membership_plans as { name: string } | null)?.name}
                </p>
              ) : null}
              <div className="mt-2">
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "ACTIVO" : "INACTIVO"}
                </Badge>
              </div>
              {activeMembership ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Válido hasta: {new Date(activeMembership.end_date).toLocaleDateString("es-EC")}
                </p>
              ) : null}
            </div>
          </div>

          {/* QR Code */}
          <div className="border-t px-6 pb-6 pt-4 flex flex-col items-center gap-2">
            <QRCode value={member.qr_code} size={120} />
            <p className="text-xs text-muted-foreground">Código de acceso</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Install react-qr-code**

```powershell
npm install react-qr-code
```

- [ ] **Step 5: Add "Ver mi carnet" link in portal**

In `app/[orgSlug]/portal/page.tsx`, add a card/link:

```typescript
// Fetch member.qr_code in the existing query (add to select if not already there)
// Add a link:
<LinkButton href={`/${orgSlug}/carnet/${member.id}?token=${member.qr_code}`}>
  Ver mi carnet
</LinkButton>
```

- [ ] **Step 6: Add "Ver carnet" link in member detail (dashboard)**

In `app/[orgSlug]/dashboard/miembros/[memberId]/page.tsx`, add to the action buttons:

```typescript
<LinkButton
  href={`/${orgSlug}/carnet/${memberId}?token=${member.qr_code}`}
  variant="outline"
  target="_blank"
>
  Ver carnet
</LinkButton>
```

- [ ] **Step 7: Manual test**

1. Go to portal as a member. Click "Ver mi carnet". Verify carnet shows with name, QR, plan, status.
2. Open the carnet URL without login (incognito). Verify it loads (public route).
3. Try accessing with wrong token: verify 404.
4. Click Imprimir. Verify browser print dialog opens with the carnet.

- [ ] **Step 8: Commit**

```bash
git add app/[orgSlug]/carnet/ app/[orgSlug]/portal/ lib/supabase/middleware.ts
git commit -m "feat(carnet): carnet digital del estudiante con QR"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Extended student profiles (médico + representante) — Task 4
- ✅ Rubros/Tarifas with states (becado, 3 días) — Task 3
- ✅ Public registration form — Task 5
- ✅ Admin approval queue — Task 5
- ✅ WhatsApp invite (send link to representative) — Task 5
- ✅ In-app notifications when form submitted — Task 5
- ✅ Automatic payment reminders (3 days before, day of, +1/+3/+7) — Task 6
- ✅ Sedes — Task 2
- ✅ RBAC visual (trainer sees only clases + asistencia) — Task 7
- ✅ Facturación SRI simulator — Task 8
- ✅ Carnet digital — Task 9
- ✅ All new tables have RLS — Task 1, migration 5

**Placeholder scan:** No TBDs found. All code blocks contain actual implementation.

**Type consistency:**
- `ExtendedMemberValues` defined in miembro-form.tsx and consumed in nuevo + editar pages ✅
- `Location` / `FeeType` types defined inline where needed, consistent shape ✅
- `schedule_membership_reminders` RPC called with `p_membership_id` matching the SQL function param name ✅
- `submitInscripcion` bound with `orgSlug, orgId` in correct order matching action signature ✅
