# FENIX Phase 2 — Inscripción, Equipos, Asistencia, Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar subida de documentos obligatoria en inscripción, modal de aprobación con rubro/sede/clase, equipos de torneo, asistencia mobile-first con estados presente/ausente/justificado, y fixes de impresión/búsqueda/layout.

**Architecture:** Next.js 14 App Router + Supabase (Postgres + Storage). Nuevas tablas `teams`, `team_members`, `class_enrollments`. La inscripción pública sube 3 archivos al bucket privado `member-documents`. La aprobación abre un modal que recoge rubro+sede+clase antes de activar al miembro. La página de sesión de clase se rediseña con botones grandes mobile-first para el entrenador.

**Tech Stack:** Next.js 14, Supabase JS client, Tailwind CSS, shadcn/ui, TypeScript, Zod, Supabase Storage.

**Spec:** Diseño aprobado en sesión de brainstorming 2026-09-22 (en contexto de conversación).

## Global Constraints

- Todas las tablas nuevas necesitan RLS siguiendo el patrón de CLAUDE.md §11.2
- Todas las tablas nuevas necesitan `grant select, insert, update, delete on <tabla> to service_role;`
- Todos los uploads van a Supabase Storage usando `createServiceClient()` con service role key
- TypeScript estricto — usar `// eslint-disable-next-line @typescript-eslint/no-explicit-any` donde los tipos de Supabase estén desactualizados
- Un commit por tarea, no por archivo
- Todo texto visible al usuario en español
- UI de asistencia: mobile-first, botones de al menos 44px de alto (touch targets)
- Moneda USD, locale es-EC en fechas

---

## File Map

**Nuevos archivos:**
- `supabase/migrations/20260922000001_phase2_tables.sql` — teams, team_members, class_enrollments, alter class_bookings, RLS, grants, bucket
- `app/[orgSlug]/inscripcion/actions.ts` — modificar: aceptar 3 archivos, subirlos a Storage, guardar URLs
- `app/[orgSlug]/inscripcion/inscripcion-form.tsx` — modificar: agregar tab "Documentos" con 3 inputs file obligatorios
- `app/[orgSlug]/dashboard/inscripciones/aprobar-modal.tsx` — NUEVO: modal con rubro/sede/clase selectors
- `app/[orgSlug]/dashboard/inscripciones/aprobar-rechazar-buttons.tsx` — modificar: abrir modal en lugar de aprobar directo
- `app/[orgSlug]/dashboard/inscripciones/actions.ts` — modificar: aprobarInscripcion acepta feeTypeId, locationId, classId
- `app/[orgSlug]/dashboard/staff/` — MOVER desde `app/[orgSlug]/dashboard/equipo/` (renombrar ruta)
- `app/[orgSlug]/dashboard/equipo/page.tsx` — REEMPLAZAR: lista de equipos de torneo
- `app/[orgSlug]/dashboard/equipo/nuevo/page.tsx` — NUEVO: crear equipo
- `app/[orgSlug]/dashboard/equipo/[teamId]/page.tsx` — NUEVO: detalle equipo + gestión de miembros
- `app/[orgSlug]/dashboard/equipo/actions.ts` — NUEVO: CRUD equipos + team_members
- `app/[orgSlug]/dashboard/clases/sesiones/[sessionId]/page.tsx` — modificar: asistencia mobile-first
- `app/[orgSlug]/dashboard/clases/sesiones/[sessionId]/attendance-actions.tsx` — NUEVO: marcar presente/ausente/justificado
- `app/[orgSlug]/dashboard/clases/sesiones/[sessionId]/actions.ts` — modificar: agregar acción marcarAsistencia
- `app/[orgSlug]/dashboard/facturacion/[facturaId]/print-factura.tsx` — modificar: fix CSS print
- `app/[orgSlug]/dashboard/pagos/page.tsx` — modificar: agregar búsqueda por nombre de miembro
- `app/[orgSlug]/dashboard/clases/page.tsx` — modificar: agregar búsqueda por nombre de clase
- `components/dashboard-sidebar.tsx` — modificar: cambiar link equipo→staff, agregar equipo→torneos
- `lib/supabase/middleware.ts` — modificar: actualizar paths bloqueados para trainer

---

## Task 1: Migraciones de base de datos

**Files:**
- Create: `supabase/migrations/20260922000001_phase2_tables.sql`

**Interfaces:**
- Produces: tablas `teams`, `team_members`, `class_enrollments`; columnas `members.cedula_url`, `member_representatives.cedula_url`; bucket `member-documents`; constraint `class_bookings.status` extendido con `justified`

- [ ] **Step 1: Crear el archivo de migración**

Crear `supabase/migrations/20260922000001_phase2_tables.sql` con:

```sql
-- ============================================================
-- 1. Columnas de documentos en members y member_representatives
-- ============================================================
alter table members
  add column if not exists cedula_url text;

alter table member_representatives
  add column if not exists cedula_url text;

-- ============================================================
-- 2. Tournament teams
-- ============================================================
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  sport text,
  category text,
  tournament_name text,
  tournament_date date,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists teams_org_idx on teams(organization_id);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (team_id, member_id)
);
create index if not exists team_members_team_idx on team_members(team_id);

-- ============================================================
-- 3. Class enrollments (inscripción permanente a clase)
-- ============================================================
create table if not exists class_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'inactive')),
  unique (class_id, member_id)
);
create index if not exists class_enrollments_class_idx on class_enrollments(class_id);
create index if not exists class_enrollments_member_idx on class_enrollments(member_id);

-- ============================================================
-- 4. Extender class_bookings.status para incluir 'justified'
-- ============================================================
alter table class_bookings
  drop constraint if exists class_bookings_status_check;
alter table class_bookings
  add constraint class_bookings_status_check
  check (status in ('booked', 'attended', 'no_show', 'cancelled', 'justified'));

-- ============================================================
-- 5. RLS — teams
-- ============================================================
alter table teams enable row level security;

create policy "teams_select_same_org" on teams for select
  using (organization_id in (
    select organization_id from organization_members
    where user_id = auth.uid() and status = 'active'
  ));

create policy "teams_write_admin_roles" on teams for insert, update, delete
  using (organization_id in (
    select organization_id from organization_members
    where user_id = auth.uid() and status = 'active' and role in ('owner','admin','staff')
  ));

-- ============================================================
-- 6. RLS — team_members
-- ============================================================
alter table team_members enable row level security;

create policy "team_members_select" on team_members for select
  using (team_id in (
    select t.id from teams t
    join organization_members om on om.organization_id = t.organization_id
    where om.user_id = auth.uid() and om.status = 'active'
  ));

create policy "team_members_write" on team_members for insert, update, delete
  using (team_id in (
    select t.id from teams t
    join organization_members om on om.organization_id = t.organization_id
    where om.user_id = auth.uid() and om.status = 'active' and om.role in ('owner','admin','staff')
  ));

-- ============================================================
-- 7. RLS — class_enrollments
-- ============================================================
alter table class_enrollments enable row level security;

create policy "class_enrollments_select" on class_enrollments for select
  using (organization_id in (
    select organization_id from organization_members
    where user_id = auth.uid() and status = 'active'
  ));

create policy "class_enrollments_write" on class_enrollments for insert, update, delete
  using (organization_id in (
    select organization_id from organization_members
    where user_id = auth.uid() and status = 'active' and role in ('owner','admin','staff','trainer')
  ));

-- ============================================================
-- 8. Grants service_role
-- ============================================================
grant select, insert, update, delete on teams to service_role;
grant select, insert, update, delete on team_members to service_role;
grant select, insert, update, delete on class_enrollments to service_role;

-- ============================================================
-- 9. Storage bucket member-documents (privado)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('member-documents', 'member-documents', false)
on conflict (id) do nothing;
```

- [ ] **Step 2: Aplicar migración en Supabase Studio**

Copiar el contenido del archivo SQL y ejecutarlo en Supabase Studio → SQL Editor. Verificar que no haya errores.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260922000001_phase2_tables.sql
git commit -m "feat(db): phase2 migrations — teams, class_enrollments, member-documents bucket"
```

---

## Task 2: Subida de archivos en inscripción pública

**Files:**
- Modify: `app/[orgSlug]/inscripcion/inscripcion-form.tsx`
- Modify: `app/[orgSlug]/inscripcion/actions.ts`

**Interfaces:**
- Consumes: Task 1 (columnas `members.cedula_url`, `member_representatives.cedula_url`, bucket `member-documents`)
- Produces: 3 campos file en el formulario; `submitInscripcion` sube archivos y guarda URLs

- [ ] **Step 1: Actualizar `inscripcion-form.tsx` — agregar tab de Documentos**

En el array `TABS` de `inscripcion-form.tsx` agregar un 4to tab `"documentos"` después de `"representante"`. En `TAB_LABELS` agregar `documentos: "Documentos"`. En `FormVals` agregar:
```typescript
cedulaEstudianteFile: File | null;
cedulaRepresentanteFile: File | null;
fotoEstudianteFile: File | null;
```

Inicializar los 3 en `useState` como `null`.

En el panel del tab `"documentos"`, agregar:

```tsx
<div className={tab === "documentos" ? "" : "hidden"}>
  <div className="space-y-4">
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-400">
      Los tres documentos son obligatorios para completar la inscripción.
    </div>
    <div className="space-y-2">
      <Label htmlFor="cedulaEstudiante">
        Cédula del estudiante <span className="text-destructive">*</span>
      </Label>
      <Input
        id="cedulaEstudiante"
        name="cedulaEstudiante"
        type="file"
        accept="image/*,application/pdf"
        required
        onChange={(e) =>
          setVals((p) => ({ ...p, cedulaEstudianteFile: e.target.files?.[0] ?? null }))
        }
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="cedulaRepresentante">
        Cédula del representante <span className="text-destructive">*</span>
      </Label>
      <Input
        id="cedulaRepresentante"
        name="cedulaRepresentante"
        type="file"
        accept="image/*,application/pdf"
        required
        onChange={(e) =>
          setVals((p) => ({ ...p, cedulaRepresentanteFile: e.target.files?.[0] ?? null }))
        }
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="fotoEstudiante">
        Foto del estudiante con fondo blanco <span className="text-destructive">*</span>
      </Label>
      <p className="text-xs text-muted-foreground">
        Esta foto aparecerá en el carnet del estudiante. Fondo blanco, rostro visible.
      </p>
      <Input
        id="fotoEstudiante"
        name="fotoEstudiante"
        type="file"
        accept="image/*"
        required
        onChange={(e) =>
          setVals((p) => ({ ...p, fotoEstudianteFile: e.target.files?.[0] ?? null }))
        }
      />
    </div>
  </div>
</div>
```

Agregar validación al hacer submit: si el tab actual no es `"documentos"` y alguno de los 3 archivos es null, mover al tab `"documentos"` y mostrar error. Agregar en `getErrorTab`:
```typescript
if (error.includes("ocumento") || error.includes("oto") || error.includes("arnet")) return "documentos";
```

- [ ] **Step 2: Actualizar `actions.ts` — subir archivos y guardar URLs**

El `<form>` envía `FormData`. Los files llegan como `File` objects en el server action. Reemplazar el comienzo de `submitInscripcion`:

```typescript
// Extraer archivos antes del parse Zod (Zod no maneja File)
const cedulaEstudianteFile = formData.get("cedulaEstudiante") as File | null;
const cedulaRepresentanteFile = formData.get("cedulaRepresentante") as File | null;
const fotoEstudianteFile = formData.get("fotoEstudiante") as File | null;

if (!cedulaEstudianteFile || cedulaEstudianteFile.size === 0)
  return { error: "La cédula del estudiante es obligatoria (tab Documentos)." };
if (!cedulaRepresentanteFile || cedulaRepresentanteFile.size === 0)
  return { error: "La cédula del representante es obligatoria (tab Documentos)." };
if (!fotoEstudianteFile || fotoEstudianteFile.size === 0)
  return { error: "La foto del estudiante es obligatoria (tab Documentos)." };
```

Después de insertar el `member` (y obtener `member.id`), subir los 3 archivos:

```typescript
async function uploadDoc(
  supabase: ReturnType<typeof createServiceClient>,
  memberId: string,
  orgId: string,
  file: File,
  slot: string
): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${orgId}/${memberId}/${slot}.${ext}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).storage
    .from("member-documents")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = (supabase as any).storage
    .from("member-documents")
    .getPublicUrl(path); // private bucket → usaremos signed URLs al visualizar
  return path; // guardar el path, no la URL pública
}
```

Guardar paths en `members.photo_url` (foto), `members.cedula_url` (cédula estudiante), `member_representatives.cedula_url` (cédula rep):

```typescript
const [cedulaEstudiantePath, fotoPath] = await Promise.all([
  uploadDoc(supabase, member.id, orgId, cedulaEstudianteFile, "cedula_estudiante"),
  uploadDoc(supabase, member.id, orgId, fotoEstudianteFile, "foto"),
]);

// Actualizar member con las URLs
await supabase.from("members").update({
  cedula_url: cedulaEstudiantePath,
  photo_url: fotoPath,
}).eq("id", member.id);
```

Guardar `cedula_url` en `member_representatives` insert agregando el campo:
```typescript
cedula_url: await uploadDoc(supabase, member.id, orgId, cedulaRepresentanteFile, "cedula_rep"),
```

- [ ] **Step 3: Commit**

```bash
git add app/[orgSlug]/inscripcion/
git commit -m "feat(inscripcion): subida obligatoria de 3 documentos (cédulas y foto)"
```

---

## Task 3: Modal de aprobación con rubro / sede / clase

**Files:**
- Create: `app/[orgSlug]/dashboard/inscripciones/aprobar-modal.tsx`
- Modify: `app/[orgSlug]/dashboard/inscripciones/aprobar-rechazar-buttons.tsx`
- Modify: `app/[orgSlug]/dashboard/inscripciones/actions.ts`
- Modify: `app/[orgSlug]/dashboard/inscripciones/page.tsx` (pasar rubros, sedes, clases)

**Interfaces:**
- Consumes: Task 1 (tabla `class_enrollments`); tablas existentes `fee_types`, `locations` (tabla `sedes`), `classes`
- Produces: `aprobarInscripcion(orgSlug, memberId, feeTypeId, locationId, classId)` — activa miembro + crea class_enrollment

- [ ] **Step 1: Actualizar `actions.ts` — aprobarInscripcion acepta nuevos parámetros**

```typescript
export async function aprobarInscripcion(
  orgSlug: string,
  memberId: string,
  feeTypeId: string | null,
  locationId: string | null,
  classId: string | null,
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) return { error: "Organización no encontrada." };

  const updates: Record<string, unknown> = {
    registration_status: "approved",
    status: "active",
  };
  if (feeTypeId) updates.fee_type_id = feeTypeId;
  if (locationId) updates.location_id = locationId;

  const { error } = await supabase
    .from("members")
    .update(updates)
    .eq("id", memberId)
    .eq("organization_id", org.id);
  if (error) return { error: "No se pudo aprobar la inscripción." };

  // Crear inscripción permanente a la clase
  if (classId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("class_enrollments").insert({
      organization_id: org.id,
      class_id: classId,
      member_id: memberId,
      status: "active",
    });
  }

  revalidatePath(`/${orgSlug}/dashboard/inscripciones`);
  revalidatePath(`/${orgSlug}/dashboard/miembros/${memberId}`);
  return {};
}
```

- [ ] **Step 2: Crear `aprobar-modal.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { aprobarInscripcion } from "./actions";

type FeeType = { id: string; name: string };
type Location = { id: string; name: string };
type Clase = { id: string; name: string };

export function AprobarModal({
  orgSlug,
  memberId,
  feeTypes,
  locations,
  clases,
  onDone,
}: {
  orgSlug: string;
  memberId: string;
  feeTypes: FeeType[];
  locations: Location[];
  clases: Clase[];
  onDone: (ok: boolean) => void;
}) {
  const [feeTypeId, setFeeTypeId] = useState<string>("none");
  const [locationId, setLocationId] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    if (!locationId) { setError("Selecciona una sede."); return; }
    if (!classId) { setError("Selecciona un horario / clase."); return; }
    setPending(true);
    setError("");
    const result = await aprobarInscripcion(
      orgSlug,
      memberId,
      feeTypeId === "none" ? null : feeTypeId,
      locationId,
      classId,
    );
    setPending(false);
    if (result?.error) { setError(result.error); return; }
    onDone(true);
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label>Rubro / Tipo de tarifa</Label>
        <Select value={feeTypeId} onValueChange={setFeeTypeId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin rubro (tarifa normal)</SelectItem>
            {feeTypes.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Sede <span className="text-destructive">*</span></Label>
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona una sede..." />
          </SelectTrigger>
          <SelectContent>
            {locations.length === 0 ? (
              <SelectItem value="_none" disabled>No hay sedes creadas</SelectItem>
            ) : locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Horario / Clase <span className="text-destructive">*</span></Label>
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona un horario..." />
          </SelectTrigger>
          <SelectContent>
            {clases.length === 0 ? (
              <SelectItem value="_none" disabled>No hay clases creadas</SelectItem>
            ) : clases.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleConfirm} disabled={pending} className="flex-1">
          {pending ? "Aprobando..." : "Confirmar aprobación"}
        </Button>
        <Button variant="outline" onClick={() => onDone(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Actualizar `aprobar-rechazar-buttons.tsx` — abrir modal**

Reemplazar el componente completo para que "Aprobar" abra un panel inline (no popup nativo) con el `AprobarModal`:

```typescript
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { rechazarInscripcion } from "./actions";
import { AprobarModal } from "./aprobar-modal";

type FeeType = { id: string; name: string };
type Location = { id: string; name: string };
type Clase = { id: string; name: string };

export function AprobarRechazarButtons({
  orgSlug,
  memberId,
  feeTypes,
  locations,
  clases,
}: {
  orgSlug: string;
  memberId: string;
  feeTypes: FeeType[];
  locations: Location[];
  clases: Clase[];
}) {
  const [showModal, setShowModal] = useState(false);
  const [pending, startTransition] = useTransition();

  const rechazar = () => {
    startTransition(async () => {
      const result = await rechazarInscripcion(orgSlug, memberId);
      if (result?.error) toast.error(result.error);
      else toast.info("Inscripción rechazada.");
    });
  };

  if (showModal) {
    return (
      <div className="w-full rounded-lg border border-[#1a1a2e] bg-[#0d0d1a] p-4">
        <p className="mb-3 font-medium text-sm">Completar antes de aprobar</p>
        <AprobarModal
          orgSlug={orgSlug}
          memberId={memberId}
          feeTypes={feeTypes}
          locations={locations}
          clases={clases}
          onDone={(ok) => {
            setShowModal(false);
            if (ok) toast.success("Inscripción aprobada. El miembro está ahora activo.");
          }}
        />
      </div>
    );
  }

  return (
    <>
      <Button size="sm" disabled={pending} onClick={() => setShowModal(true)}>
        Aprobar
      </Button>
      <Button size="sm" variant="destructive" disabled={pending} onClick={rechazar}>
        Rechazar
      </Button>
    </>
  );
}
```

- [ ] **Step 4: Actualizar `inscripciones/page.tsx` — pasar datos al componente**

En la página de inscripciones, agregar fetch de `fee_types`, `locations`, `classes` junto con los miembros pendientes:

```typescript
const [{ data: pending }, { data: feeTypes }, { data: locations }, { data: clases }] =
  await Promise.all([
    supabase.from("members").select("id, full_name, birth_date, school, grade, created_at, registration_status")
      .eq("organization_id", org.id).eq("registration_status", "pending_approval").order("created_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("fee_types").select("id, name").eq("organization_id", org.id).eq("is_active", true),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("locations").select("id, name").eq("organization_id", org.id).eq("is_active", true),
    supabase.from("classes").select("id, name").eq("organization_id", org.id).eq("is_active", true).order("name"),
  ]);
```

Pasar `feeTypes ?? []`, `locations ?? []`, `clases ?? []` al componente `<AprobarRechazarButtons>`.

También actualizar el uso de `AprobarRechazarButtons` en `app/[orgSlug]/dashboard/miembros/[memberId]/page.tsx` para pasar los mismos datos (agregar fetches ahí también).

- [ ] **Step 5: Commit**

```bash
git add app/[orgSlug]/dashboard/inscripciones/
git commit -m "feat(inscripciones): modal de aprobación con rubro, sede y clase obligatorios"
```

---

## Task 4: Renombrar equipo→staff y crear equipos de torneo

**Files:**
- Move (rename): `app/[orgSlug]/dashboard/equipo/` → `app/[orgSlug]/dashboard/staff/`
- Create: `app/[orgSlug]/dashboard/equipo/page.tsx` (nueva — lista torneos)
- Create: `app/[orgSlug]/dashboard/equipo/nuevo/page.tsx`
- Create: `app/[orgSlug]/dashboard/equipo/[teamId]/page.tsx`
- Create: `app/[orgSlug]/dashboard/equipo/actions.ts`
- Modify: `components/dashboard-sidebar.tsx`
- Modify: `lib/supabase/middleware.ts`

**Interfaces:**
- Consumes: Task 1 (tablas `teams`, `team_members`)
- Produces: CRUD completo de equipos de torneo; staff management en `/dashboard/staff`

- [ ] **Step 1: Mover directorio equipo → staff**

```bash
# En PowerShell desde la raíz del proyecto:
Move-Item "app/[orgSlug]/dashboard/equipo" "app/[orgSlug]/dashboard/staff"
```

- [ ] **Step 2: Actualizar sidebar**

En `components/dashboard-sidebar.tsx`, en `buildGroups`:
- Cambiar `{ href: \`/${orgSlug}/dashboard/equipo\`, label: "Equipo", icon: UserPlus }` por `{ href: \`/${orgSlug}/dashboard/staff\`, label: "Staff / Equipo", icon: UserPlus }`
- Agregar en el grupo "Operaciones": `{ href: \`/${orgSlug}/dashboard/equipo\`, label: "Equipos torneo", icon: Trophy }`

Importar `Trophy` de `lucide-react`.

En `buildTrainerGroups`, actualizar el link de "Equipo" para apuntar a `/dashboard/staff`.

- [ ] **Step 3: Actualizar middleware**

En `lib/supabase/middleware.ts`, reemplazar en `isTrainerRestrictedPath` la lógica de `equipo`. Los trainers pueden ver `/staff` y `/equipo` (ambos en modo lectura). Agregar a rutas bloqueadas para trainer: escritura en equipo/staff (las páginas de nuevo/editar). Como no hay rutas de edición directa de staff aún, solo asegurar que `/equipo/nuevo` esté bloqueado:

```typescript
pathname.match(/\/equipo\/nuevo/) !== null
```

- [ ] **Step 4: Crear `app/[orgSlug]/dashboard/equipo/actions.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const teamSchema = z.object({
  name: z.string().min(2, "El nombre del equipo es requerido."),
  sport: z.string().optional(),
  category: z.string().optional(),
  tournament_name: z.string().optional(),
  tournament_date: z.string().optional(),
  notes: z.string().optional(),
});

export async function crearEquipo(
  orgSlug: string,
  orgId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = teamSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("teams").insert({
    organization_id: orgId,
    ...parsed.data,
    tournament_date: parsed.data.tournament_date || null,
  });
  if (error) return { error: "No se pudo crear el equipo." };

  revalidatePath(`/${orgSlug}/dashboard/equipo`);
  return {};
}

export async function agregarMiembroEquipoTorneo(
  orgSlug: string,
  teamId: string,
  memberId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("team_members").insert({ team_id: teamId, member_id: memberId });
  if (error && error.code !== "23505") return { error: "No se pudo agregar el miembro." };
  revalidatePath(`/${orgSlug}/dashboard/equipo/${teamId}`);
  return {};
}

export async function quitarMiembroEquipoTorneo(
  orgSlug: string,
  teamId: string,
  memberId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("team_members").delete().eq("team_id", teamId).eq("member_id", memberId);
  revalidatePath(`/${orgSlug}/dashboard/equipo/${teamId}`);
  return {};
}
```

- [ ] **Step 5: Crear `app/[orgSlug]/dashboard/equipo/page.tsx`** (lista de equipos)

```typescript
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";

export default async function EquiposTorneoPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", orgSlug).maybeSingle();
  if (!org) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: teams } = await (supabase as any)
    .from("teams")
    .select("id, name, sport, category, tournament_name, tournament_date")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Equipos de torneo</h1>
          <p className="text-sm text-muted-foreground">Equipos para competencias y torneos</p>
        </div>
        <LinkButton href={`/${orgSlug}/dashboard/equipo/nuevo`}>Nuevo equipo</LinkButton>
      </div>

      {!teams?.length ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>No hay equipos creados.</p>
          <p className="text-xs mt-1">Crea el primero para agregar deportistas y prepararte para el torneo.</p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {(teams as Array<{ id: string; name: string; sport: string | null; category: string | null; tournament_name: string | null; tournament_date: string | null }>).map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">
                  {[t.sport, t.category].filter(Boolean).join(" · ")}
                </p>
                {t.tournament_name ? (
                  <p className="text-xs text-muted-foreground">
                    {t.tournament_name}{t.tournament_date ? ` — ${new Date(t.tournament_date).toLocaleDateString("es-EC")}` : ""}
                  </p>
                ) : null}
              </div>
              <LinkButton href={`/${orgSlug}/dashboard/equipo/${t.id}`} variant="outline" size="sm">
                Ver equipo
              </LinkButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Crear `app/[orgSlug]/dashboard/equipo/nuevo/page.tsx`**

Página con formulario para crear equipo. Campos: nombre*, deporte, categoría, nombre torneo, fecha torneo, notas. Usar `crearEquipo` action con `useActionState`. Redirigir a `/dashboard/equipo` al guardar (el action revalida).

```typescript
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { crearEquipo } from "../actions";
import { NuevoEquipoForm } from "./nuevo-equipo-form";

export default async function NuevoEquipoPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", orgSlug).maybeSingle();
  if (!org) notFound();

  const action = crearEquipo.bind(null, orgSlug, org.id);
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo equipo de torneo</h1>
      <NuevoEquipoForm action={action} orgSlug={orgSlug} />
    </div>
  );
}
```

Crear `nuevo-equipo-form.tsx` como client component con `useActionState` y campos para nombre, deporte, categoría, nombre_torneo, fecha_torneo (date input), notas (textarea). Al recibir state sin error, redirigir con `router.push`.

- [ ] **Step 7: Crear `app/[orgSlug]/dashboard/equipo/[teamId]/page.tsx`**

Muestra info del equipo + lista de miembros actuales + formulario para agregar miembro (Select de miembros activos no ya en el equipo). Acciones: agregar y quitar miembros usando `agregarMiembroEquipoTorneo` / `quitarMiembroEquipoTorneo`.

```typescript
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { TeamMemberManager } from "./team-member-manager";
import { agregarMiembroEquipoTorneo, quitarMiembroEquipoTorneo } from "../actions";

export default async function EquipoDetallePage({
  params,
}: { params: Promise<{ orgSlug: string; teamId: string }> }) {
  const { orgSlug, teamId } = await params;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: team } = await (supabase as any)
    .from("teams").select("id, name, sport, category, tournament_name, tournament_date, notes, organization_id")
    .eq("id", teamId).maybeSingle();
  if (!team) notFound();

  const [{ data: teamMembers }, { data: allMembers }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("team_members")
      .select("member_id, members(id, full_name)")
      .eq("team_id", teamId),
    supabase.from("members")
      .select("id, full_name")
      .eq("organization_id", team.organization_id)
      .eq("status", "active")
      .order("full_name"),
  ]);

  const memberIdsInTeam = new Set((teamMembers ?? []).map((tm: { member_id: string }) => tm.member_id));
  const availableMembers = (allMembers ?? []).filter((m) => !memberIdsInTeam.has(m.id));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <LinkButton href={`/${orgSlug}/dashboard/equipo`} variant="ghost" size="sm" className="mb-2">
          ← Volver a equipos
        </LinkButton>
        <h1 className="text-2xl font-semibold">{team.name}</h1>
        <p className="text-sm text-muted-foreground">
          {[team.sport, team.category].filter(Boolean).join(" · ")}
        </p>
        {team.tournament_name ? (
          <p className="text-sm text-muted-foreground">
            Torneo: {team.tournament_name}
            {team.tournament_date ? ` — ${new Date(team.tournament_date).toLocaleDateString("es-EC")}` : ""}
          </p>
        ) : null}
        {team.notes ? <p className="mt-2 text-sm">{team.notes}</p> : null}
      </div>

      <TeamMemberManager
        orgSlug={orgSlug}
        teamId={teamId}
        teamMembers={(teamMembers ?? []).map((tm: { member_id: string; members: { id: string; full_name: string } | null }) => ({
          member_id: tm.member_id,
          full_name: tm.members?.full_name ?? "—",
        }))}
        availableMembers={availableMembers ?? []}
        agregarAction={agregarMiembroEquipoTorneo.bind(null, orgSlug, teamId)}
        quitarAction={quitarMiembroEquipoTorneo.bind(null, orgSlug, teamId)}
      />
    </div>
  );
}
```

Crear `team-member-manager.tsx` como client component que muestra la lista de miembros del equipo con botón "Quitar" en cada fila, y un Select + botón "Agregar" para añadir miembros disponibles.

- [ ] **Step 8: Commit**

```bash
git add app/[orgSlug]/dashboard/equipo/ app/[orgSlug]/dashboard/staff/ components/dashboard-sidebar.tsx lib/supabase/middleware.ts
git commit -m "feat(equipos): equipos de torneo + renombrar staff"
```

---

## Task 5: Asistencia mobile-first del entrenador

**Files:**
- Modify: `app/[orgSlug]/dashboard/clases/sesiones/[sessionId]/page.tsx`
- Modify: `app/[orgSlug]/dashboard/clases/sesiones/[sessionId]/actions.ts`
- Create: `app/[orgSlug]/dashboard/clases/sesiones/[sessionId]/attendance-panel.tsx`

**Interfaces:**
- Consumes: Task 1 (tabla `class_enrollments`)
- Produces: UI mobile-first con botones Presente/Ausente/Justificado para cada alumno inscrito

- [ ] **Step 1: Actualizar `actions.ts` — acción marcarAsistencia**

Agregar en `actions.ts` de la sesión:

```typescript
export async function marcarAsistencia(
  orgSlug: string,
  sessionId: string,
  orgId: string,
  memberId: string,
  estado: "attended" | "no_show" | "justified"
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // Buscar si existe booking para este miembro en esta sesión
  const { data: existing } = await supabase
    .from("class_bookings")
    .select("id")
    .eq("class_session_id", sessionId)
    .eq("member_id", memberId)
    .maybeSingle();

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("class_bookings")
      .update({ status: estado })
      .eq("id", existing.id);
  } else {
    // Crear booking y marcar directamente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("class_bookings").insert({
      class_session_id: sessionId,
      organization_id: orgId,
      member_id: memberId,
      status: estado,
    });
  }

  revalidatePath(`/${orgSlug}/dashboard/clases/sesiones/${sessionId}`);
  return {};
}
```

- [ ] **Step 2: Crear `attendance-panel.tsx`**

Client component. Recibe lista de miembros inscritos con su estado actual. Para cada miembro muestra 3 botones grandes (verde=Presente, rojo=Ausente, amarillo=Justificado). El botón activo se resalta. Al tocar, llama al server action.

```typescript
"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";

type AttendanceMember = {
  memberId: string;
  fullName: string;
  status: "attended" | "no_show" | "justified" | "booked" | null;
};

export function AttendancePanel({
  members,
  marcarAction,
}: {
  members: AttendanceMember[];
  marcarAction: (memberId: string, estado: "attended" | "no_show" | "justified") => Promise<{ error?: string }>;
}) {
  const [pending, startTransition] = useTransition();

  function marcar(memberId: string, estado: "attended" | "no_show" | "justified") {
    startTransition(() => marcarAction(memberId, estado));
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No hay alumnos inscritos en este horario.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((m) => (
        <div
          key={m.memberId}
          className="flex items-center justify-between rounded-lg border border-[#1a1a2e] bg-[#0d0d1a] p-3"
        >
          <span className="font-medium text-sm truncate mr-3">{m.fullName}</span>
          <div className="flex shrink-0 gap-1.5">
            <button
              disabled={pending}
              onClick={() => marcar(m.memberId, "attended")}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold transition-colors min-h-[44px]",
                m.status === "attended"
                  ? "bg-green-600 text-white"
                  : "bg-[#1a1a2e] text-green-400 hover:bg-green-900/40"
              )}
            >
              Presente
            </button>
            <button
              disabled={pending}
              onClick={() => marcar(m.memberId, "no_show")}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold transition-colors min-h-[44px]",
                m.status === "no_show"
                  ? "bg-red-600 text-white"
                  : "bg-[#1a1a2e] text-red-400 hover:bg-red-900/40"
              )}
            >
              Ausente
            </button>
            <button
              disabled={pending}
              onClick={() => marcar(m.memberId, "justified")}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold transition-colors min-h-[44px]",
                m.status === "justified"
                  ? "bg-amber-500 text-white"
                  : "bg-[#1a1a2e] text-amber-400 hover:bg-amber-900/40"
              )}
            >
              Justificado
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Actualizar `page.tsx` de sesión**

Agregar fetch de `class_enrollments` para obtener alumnos inscritos permanentemente en la clase:

```typescript
// Obtener la class_id de la sesión
const classId = (session.classes as unknown as { id?: string })?.id
  ?? (session as unknown as { class_id?: string }).class_id;

// Alumnos inscritos permanentemente en esta clase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data: enrollments } = await (supabase as any)
  .from("class_enrollments")
  .select("member_id, members(id, full_name)")
  .eq("class_id", classId)   // necesita class_id en la sesión
  .eq("status", "active");
```

Nota: `class_sessions` ya tiene `class_id` implícito via la relación. Asegurar que el select de `class_sessions` incluya `class_id`.

Cambiar el select de sesión a:
```typescript
.select("id, class_id, organization_id, session_date, start_time, end_time, classes(name, capacity, location)")
```

Combinar enrollments con bookings para mostrar estado actual:

```typescript
const bookingMap = new Map(
  (bookings ?? []).map((b) => [
    (b.members as unknown as { id: string } | null)?.id,
    b.status as "attended" | "no_show" | "justified" | "booked",
  ])
);

const attendanceMembers = (enrollments ?? []).map((e: {
  member_id: string;
  members: { id: string; full_name: string } | null;
}) => ({
  memberId: e.member_id,
  fullName: e.members?.full_name ?? "—",
  status: bookingMap.get(e.member_id) ?? null,
}));
```

Reemplazar la tabla de bookings existente con `<AttendancePanel>` cuando hay enrollments. Mantener el `<ReservarForm>` (para reservas adicionales) solo para admins (verificar rol).

Pasar la action al panel:
```typescript
const marcarAction = marcarAsistencia.bind(null, orgSlug, sessionId, session.organization_id);
// En JSX:
<AttendancePanel members={attendanceMembers} marcarAction={marcarAction} />
```

- [ ] **Step 4: Commit**

```bash
git add app/[orgSlug]/dashboard/clases/sesiones/
git commit -m "feat(asistencia): panel mobile-first presente/ausente/justificado con inscripciones permanentes"
```

---

## Task 6: Fixes puntuales — factura, búsqueda, layout

**Files:**
- Modify: `app/[orgSlug]/dashboard/facturacion/[facturaId]/print-factura.tsx`
- Modify: `app/[orgSlug]/dashboard/pagos/page.tsx`
- Modify: `app/[orgSlug]/dashboard/clases/page.tsx`
- Audit: todos los archivos de dashboard con `max-w-*` para asegurar `mx-auto`

**Interfaces:**
- No nuevas interfaces

- [ ] **Step 1: Fix impresión de factura**

El problema es que Tailwind purga estilos de `bg-white` en modo print en algunos navegadores. Solución: agregar `print-color-adjust: exact` al wrapper y usar un `<style>` tag con `@media print` para garantizar que los colores se preserven:

En `print-factura.tsx`, agregar al div principal del contenido:

```tsx
<div
  id="factura-content"
  style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
  className="rounded-lg border bg-white p-8 text-black text-sm print:border-none print:p-0 print:shadow-none"
>
```

Agregar al `<head>` via `<style>` (o en el wrapper de página) el CSS de print:

```tsx
<>
  <style>{`
    @media print {
      body { background: white !important; }
      #factura-content { background: white !important; color: black !important; }
      .print\\:hidden { display: none !important; }
    }
  `}</style>
  {/* resto del componente */}
</>
```

Cambiar todas las clases de color del contenido de la factura de `text-muted-foreground` a `text-gray-600` para que no dependan de variables CSS que pueden no funcionar al imprimir.

- [ ] **Step 2: Búsqueda en pagos por nombre de miembro**

En `app/[orgSlug]/dashboard/pagos/page.tsx`, la query a `payments` ya hace join con `members(full_name)`. Para filtrar por nombre, agregar al searchParams `{ q?: string }` y añadir un input de búsqueda al form existente. En el query:

```typescript
if (q) {
  // Supabase no permite filter en relaciones join directamente.
  // Alternativa: traer todos y filtrar en JS, o hacer subquery.
  // Opción más simple: filtrar por member IDs que coincidan con q:
  const { data: matchingMembers } = await supabase
    .from("members")
    .select("id")
    .eq("organization_id", org!.id)
    .ilike("full_name", `%${q}%`);
  if (matchingMembers?.length) {
    query = query.in("member_id", matchingMembers.map((m) => m.id));
  } else {
    // No hay coincidencias, retornar vacío
    query = query.eq("member_id", "00000000-0000-0000-0000-000000000000");
  }
}
```

Agregar `<Input name="q" placeholder="Buscar por nombre del miembro" defaultValue={q} className="max-w-xs" />` al formulario de filtros.

- [ ] **Step 3: Búsqueda en clases**

En `app/[orgSlug]/dashboard/clases/page.tsx`, leer `searchParams: Promise<{ q?: string }>` y agregar `.ilike("name", \`%${q}%\`)` al query cuando `q` tenga valor. Agregar input de búsqueda sobre la lista.

- [ ] **Step 4: Audit de layout / centrado**

Revisar estos archivos y asegurar que los contenedores `max-w-*` tengan `mx-auto` cuando estén en páginas de ancho completo (no en `space-y-6` que ya son flex column):

- `app/[orgSlug]/dashboard/configuracion/suscripcion/page.tsx` — verificar contenedor principal
- `app/[orgSlug]/dashboard/page.tsx` (dashboard principal) — verificar que KPIs estén centrados
- `app/[orgSlug]/dashboard/planes/page.tsx` — verificar tabla
- `app/[orgSlug]/dashboard/configuracion/pagos/page.tsx` — verificar

Para páginas con `max-w-lg` o `max-w-2xl` que son el único contenido del `<main>`, agregar `mx-auto` si no tienen. El `<main>` tiene `p-4 md:p-8` pero no centra el contenido por defecto.

- [ ] **Step 5: Commit**

```bash
git add app/[orgSlug]/dashboard/facturacion/ app/[orgSlug]/dashboard/pagos/page.tsx app/[orgSlug]/dashboard/clases/page.tsx
git commit -m "fix: impresión factura, búsqueda en pagos y clases, centrado de layouts"
```

---

## Self-Review

**Cobertura del spec:**
- ✅ 3 archivos obligatorios en inscripción — Task 2
- ✅ Rubro en aprobación — Task 3
- ✅ Sede en aprobación — Task 3
- ✅ Clase/horario en aprobación + class_enrollment — Task 3
- ✅ Equipos de torneo (nombre/deporte/categoría/torneo/fecha/notas) — Task 4
- ✅ Renombrar staff — Task 4
- ✅ Asistencia mobile-first presente/ausente/justificado — Task 5
- ✅ Entrenador ve alumnos inscritos — Task 5 (via class_enrollments)
- ✅ Fix factura impresión — Task 6
- ✅ Búsqueda en pagos — Task 6
- ✅ Búsqueda en clases — Task 6
- ✅ Layout/centrado — Task 6
- ✅ DB migrations con RLS + grants — Task 1

**Gaps identificados y resueltos:**
- La sesión de clase necesita `class_id` en el select — mencionado en Task 5 Step 3
- `agregarMiembroEquipoTorneo` usa `.bind(null, orgSlug, teamId)` pero la firma es `(orgSlug, teamId, memberId)` — correcto, memberId viene del componente
- El modal de aprobación también se usa en `/dashboard/miembros/[memberId]/page.tsx` — mencionado en Task 3 Step 4

**Placeholders:** ninguno encontrado.

**Consistencia de tipos:** `AttendanceMember.status` incluye `"booked" | null` para los que aún no tienen booking — correcto, el panel los trata como sin marcar.
