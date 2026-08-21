# CLAUDE.md — GestorClub (plataforma de gestión de clubes deportivos)

> Este archivo es la **fuente de verdad** del proyecto. Antes de escribir código, Claude Code debe leer este documento completo. Cualquier duda de alcance se resuelve consultando este archivo primero; solo se pregunta al usuario si algo es **genuinamente ambiguo y no está cubierto aquí**.

---

## 0. Instrucciones para Claude Code (leer primero)

1. Este es un proyecto **multi-tenant SaaS**: varios clubes ("organizaciones") usan la misma app, cada uno con sus propios datos, aislados entre sí.
2. El nombre de trabajo del proyecto es **GestorClub**. Es un placeholder — se puede renombrar con un find & replace global de "GestorClub" cuando el cliente final decida el nombre de marca. No inventes otro nombre.
3. País objetivo: **Ecuador**. Moneda: **USD** (Ecuador usa dólar americano, así que NO hay que hacer conversión de moneda ni mostrar símbolos de otras monedas). Zona horaria por defecto: `America/Guayaquil`. Idioma de toda la interfaz: **español (es-EC)**. No implementar i18n multi-idioma en el MVP; dejar el texto en español directamente (no hace falta librería de traducción todavía).
4. Sigue el **orden de fases** de la sección 14. No saltes a construir "IA" o "gamificación" antes de que el núcleo (miembros, pagos, membresías) funcione end-to-end.
5. No agregues funcionalidades que no estén en este documento sin antes preguntar. Si algo no está definido (ej. un detalle visual menor), toma la decisión más simple y razonable, y déjalo anotado en un comentario `// TODO: confirmar con cliente` en vez de detener el desarrollo.
6. Cada módulo de la sección 8 debe entregarse con: migraciones de base de datos, políticas RLS, backend (API routes o server actions), UI, y al menos una prueba manual documentada en el PR/commit.
7. Commits pequeños y descriptivos. No mezclar módulos distintos en un mismo commit.
8. Todo dato sensible (tokens de WhatsApp, llaves de pagos) va en variables de entorno, nunca hardcodeado. Ver sección 11.

---

## 1. Resumen ejecutivo

GestorClub es un software de gestión para clubes deportivos, academias y gimnasios en Ecuador. Permite a un club:

- Controlar sus miembros/afiliados y sus membresías.
- Cobrar y hacer seguimiento de pagos (transferencia bancaria + pasarela de pago opcional).
- Enviar recordatorios automáticos de pago por WhatsApp.
- Controlar acceso y asistencia (check-in por código QR).
- Gestionar clases, horarios y entrenadores.
- Ver un dashboard con métricas de recaudo, asistencia y miembros activos.

El objetivo de negocio (igual al de la competencia analizada, p. ej. Controla.Club) es **reducir la morosidad y el trabajo manual de cobro**, automatizando recordatorios y centralizando el control de pagos y accesos.

La arquitectura se construye **multi-club desde el día uno** (aunque el primer cliente sea un solo club), para poder vender la plataforma a otros clubes en el futuro sin rehacer la base de datos.

---

## 2. Stack tecnológico (exacto — no sustituir sin aprobación)

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | TypeScript en todo el proyecto, sin excepciones. |
| UI | **Tailwind CSS + shadcn/ui** | Componentes accesibles, mobile-first. |
| Backend / DB | **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions) | Un solo proyecto de Supabase para todo (multi-tenant a nivel de fila, con RLS). |
| ORM/queries | **Supabase JS client** en server actions / route handlers. Usar **Drizzle ORM** o **Zod** para validar tipos e inputs si el equipo lo prefiere; si no, queries directas tipadas con el tipo generado por Supabase CLI (`supabase gen types typescript`). |
| Autenticación | **Supabase Auth** (email + contraseña; teléfono/OTP opcional fase 2) |
| Pagos | Ver sección 8.5 — transferencia bancaria manual (MVP) + integración **Kushki** (fase 2) |
| WhatsApp | **Twilio WhatsApp Business API** para MVP (rápido de integrar) → migrar a **Meta WhatsApp Cloud API** oficial en fase 2/3 para reducir costos a escala. Ver sección 8.6. |
| Email transaccional | **Resend** |
| Almacenamiento de archivos | **Supabase Storage** (buckets: `avatars`, `payment-proofs`, `org-logos`, `certifications`) |
| Hosting | **Vercel** (frontend + API routes) + **Supabase Cloud** (DB/Auth/Storage) |
| PWA | `next-pwa` o `Serwist` — la app debe ser instalable en celular (manifest.json + service worker), pero **no** se construye app nativa en este alcance. |
| Cron / jobs programados | **Vercel Cron** llamando a Route Handlers protegidos con `CRON_SECRET`, o Supabase Edge Functions + `pg_cron`. |
| Gestión de formularios | `react-hook-form` + `zod` |
| Gráficas del dashboard | `recharts` (seguir buenas prácticas de accesibilidad de color: paleta consistente, contraste AA, no usar solo color para diferenciar series) |
| Testing | `vitest` para lógica de negocio, `playwright` para flujos críticos (registro de pago, check-in QR, login) |

No usar Stripe (el cliente pidió explícitamente evitarlo por ser Ecuador). No usar Firebase. No usar un backend separado en Express — todo vive en Next.js + Supabase para minimizar piezas móviles.

---

## 3. Arquitectura multi-tenant

- Modelo: **base de datos compartida, aislamiento por fila** usando una columna `organization_id` en (casi) todas las tablas + **Row Level Security (RLS)** de Postgres. No usar schema-per-tenant ni base de datos separada por cliente (demasiado overhead operativo para el tamaño de este producto).
- Enrutamiento: **basado en path**, no en subdominio, para evitar la complejidad de wildcard DNS/SSL en el MVP.
  - `/[orgSlug]/dashboard/...` → panel administrativo del club (dueño, admin, staff, entrenador).
  - `/[orgSlug]/portal/...` → portal del miembro (self-service).
  - `/admin/...` → panel del **super-admin de la plataforma** (el dueño de GestorClub como negocio SaaS), fuera de cualquier `orgSlug`.
  - `/auth/...` → login, registro, recuperación de contraseña (compartido).
  - `/` → landing pública simple de la plataforma (marketing + botón "crear mi club" y "ya tengo cuenta").
  - Subdominios por club (`miclub.gestorclub.app`) quedan anotados como mejora de fase 3+, no se construyen ahora.
- Un usuario (`auth.users` de Supabase) puede pertenecer a **más de una organización** con roles distintos en cada una (tabla puente `organization_members`, ver esquema).
- Todas las consultas del lado servidor deben filtrar explícitamente por `organization_id` **además** de confiar en RLS (defensa en profundidad — nunca depender solo del filtro de RLS ni solo del filtro manual).

---

## 4. Roles y permisos (RBAC)

| Rol | Nivel | Puede hacer |
|---|---|---|
| `platform_admin` | Plataforma (fuera de cualquier club) | Ver/gestionar todas las organizaciones, planes de suscripción SaaS, suspender clubes por falta de pago, ver métricas globales. |
| `owner` | Club | Todo dentro de su club: configuración, facturación del club, invitar/quitar staff, borrar el club. |
| `admin` | Club | Gestionar miembros, pagos, membresías, clases, staff (excepto configuración de facturación y borrar el club). |
| `staff` (recepción) | Club | Registrar pagos (revisar comprobantes), check-in manual, ver miembros, ver clases. No puede editar planes de membresía ni configuración. |
| `trainer` (entrenador) | Club | Ver sus clases asignadas, marcar asistencia de sus clases, ver lista de sus alumnos. No ve pagos. |
| `member` (miembro/afiliado) | Portal | Ver su propia membresía y pagos, subir comprobante de pago, reservar clases, ver su código QR de acceso, ver historial de asistencia propio. |

Reglas de negocio de permisos:
- Solo `owner` puede cambiar el plan de suscripción SaaS del club o eliminar la organización.
- Solo `owner`/`admin` pueden aprobar o rechazar comprobantes de pago.
- Un `member` nunca ve datos de otro miembro (ni en API ni en UI).
- `platform_admin` **no** ve datos operativos día a día de los clubes (miembros individuales, comprobantes) salvo que entre en modo soporte explícito (acción registrada en `audit_logs`).

---

## 5. Modelo de datos (Postgres / Supabase)

> Escribir esto como migraciones SQL en `supabase/migrations/`. Los tipos exactos (uuid, timestamptz, etc.) son obligatorios. Todas las tablas con `organization_id` deben tener RLS habilitado (ver sección 11.2).

```sql
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

-- =========================================
-- MIEMBROS / AFILIADOS DEL CLUB (los clientes del club, no necesariamente tienen login)
-- =========================================

create table members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id),  -- null hasta que el miembro active su portal
  full_name text not null,
  email text,
  phone text not null,                     -- obligatorio: es el canal de WhatsApp
  document_id text,                        -- cédula
  birth_date date,
  photo_url text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  status text not null default 'active' check (status in ('active','inactive','frozen','expired')),
  join_date date not null default current_date,
  qr_code text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on members (organization_id);

-- =========================================
-- PLANES DE MEMBRESÍA (los planes que el club vende a sus miembros)
-- =========================================

create table membership_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,                      -- "Mensualidad full", "Pack 8 clases"
  description text,
  price numeric(10,2) not null,
  billing_cycle text not null check (billing_cycle in ('monthly','quarterly','annual','class_pack','single_session')),
  sessions_included int,                   -- solo si billing_cycle = 'class_pack'
  duration_days int not null,              -- vigencia del plan en días
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  plan_id uuid not null references membership_plans(id),
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('active','expired','frozen','cancelled')),
  auto_renew boolean not null default false,
  sessions_remaining int,                  -- solo para class_pack
  created_at timestamptz not null default now()
);
create index on memberships (organization_id, member_id);

-- =========================================
-- PAGOS
-- =========================================

create table payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  membership_id uuid references memberships(id),
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

-- =========================================
-- RECORDATORIOS Y NOTIFICACIONES
-- =========================================

create table whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade, -- null = plantilla global por defecto
  key text not null,          -- 'bienvenida','recordatorio_previo','recordatorio_vencido','confirmacion_pago'
  content text not null,      -- soporta variables {{nombre}}, {{monto}}, {{fecha_vencimiento}}
  is_active boolean not null default true
);

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

create table notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid references members(id),
  user_id uuid references auth.users(id),
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================
-- ASISTENCIA / CONTROL DE ACCESO
-- =========================================

create table attendance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  method text not null default 'qr' check (method in ('qr','manual','staff')),
  checked_in_by uuid references auth.users(id) -- null si fue self-service por QR
);
create index on attendance (organization_id, member_id, checked_in_at);

-- =========================================
-- CLASES Y HORARIOS
-- =========================================

create table classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  trainer_user_id uuid references auth.users(id),
  capacity int not null default 20,
  location text,
  recurrence_rule jsonb not null, -- {"days": ["mon","wed","fri"], "start_time":"18:00", "end_time":"19:00"}
  is_active boolean not null default true
);

create table class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'scheduled' check (status in ('scheduled','cancelled','completed'))
);

create table class_bookings (
  id uuid primary key default gen_random_uuid(),
  class_session_id uuid not null references class_sessions(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  status text not null default 'booked' check (status in ('booked','attended','no_show','cancelled')),
  booked_at timestamptz not null default now(),
  unique (class_session_id, member_id)
);

-- =========================================
-- AUDITORÍA
-- =========================================

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  actor_user_id uuid references auth.users(id),
  action text not null,          -- 'payment.approved', 'member.created', etc.
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
```

---

## 6. Reglas de negocio clave

1. **Vencimiento de membresía**: un job diario marca como `expired` toda `membership` cuyo `end_date < hoy` y su `status = 'active'`. Al expirar, el `member.status` pasa a `expired` si no tiene otra membresía activa.
2. **Recordatorios automáticos** (ver 8.6) se generan automáticamente al crear/renovar una membresía, en estos momentos:
   - 3 días antes del vencimiento.
   - El día del vencimiento.
   - 1, 3 y 7 días después de vencida (si sigue sin pago aprobado).
3. **Aprobación de pago por transferencia**: al aprobar un pago `pending_review` → `approved`, el sistema debe automáticamente:
   - Crear o extender la `membership` correspondiente (`end_date += duration_days` del plan).
   - Cambiar `member.status` a `active`.
   - Cancelar recordatorios pendientes asociados a ese pago.
   - Enviar WhatsApp de confirmación de pago (plantilla `confirmacion_pago`).
   - Registrar en `audit_logs`.
4. **Rechazo de comprobante**: si se rechaza, notificar al miembro por WhatsApp pidiendo que vuelva a subir el comprobante correcto.
5. **Check-in QR**: solo permite el check-in si `member.status = 'active'` y tiene una `membership` vigente (`status = 'active'` y `end_date >= hoy`). Si no, mostrar mensaje claro en pantalla ("Membresía vencida, contacta a recepción") en vez de un error genérico.
6. **Multi-membresía**: un miembro puede tener más de una membresía activa a la vez (ej. mensualidad + pack de clases). El check-in valida que **al menos una** esté vigente.
7. **Suspensión de club por falta de pago SaaS**: si `organization_subscriptions.status = 'past_due'` por más de 7 días, el club pasa a `organizations.status = 'suspended'`: el panel se vuelve de solo lectura (excepto para pagar la suscripción) hasta regularizar.

---

## 7. Portal del miembro (self-service)

Ruta: `/[orgSlug]/portal`. Un miembro accede con su cuenta (email/clave o link mágico). Debe poder:

- Ver el estado de su membresía (activa, días restantes, próximo vencimiento).
- Ver su historial de pagos.
- Subir el comprobante de una transferencia para su próximo pago.
- Ver y compartir/descargar su **código QR** de acceso.
- Reservar/cancelar clases según cupo disponible.
- Ver su historial de asistencia.
- Actualizar sus datos de contacto.
- Recibir notificaciones in-app además de WhatsApp.

---

## 8. Módulos funcionales (con criterios de aceptación)

### 8.1 Registro y onboarding de un club nuevo (`/auth/registro`)
- Formulario: nombre del club, email, teléfono, contraseña, nombre del dueño.
- Al registrarse: crea `organizations` (status `trial`, `trial_ends_at = now() + 14 días`), crea `organization_subscriptions` con el plan `trial`, crea `organization_members` con rol `owner`.
- Redirige a un wizard corto de 3 pasos: (1) datos del club y logo, (2) crear el primer plan de membresía, (3) invitar al primer miembro de staff (opcional, se puede saltar).
- Criterio de aceptación: un club nuevo puede quedar operativo (con al menos un plan de membresía creado) en menos de 5 minutos sin ayuda.

### 8.2 Autenticación y roles
- Login/registro con email+contraseña vía Supabase Auth.
- Recuperación de contraseña por email (Resend + Supabase Auth reset flow).
- Un usuario logueado que pertenece a más de un club ve un selector de club al entrar.
- Middleware de Next.js que, en cada request a `/[orgSlug]/...`, valida que el usuario tenga una fila en `organization_members` para ese `orgSlug` con `status = 'active'`; si no, 403.

### 8.3 Gestión de miembros (`/[orgSlug]/dashboard/miembros`)
- Listado con búsqueda (nombre, teléfono, cédula), filtros por estado (`active/inactive/frozen/expired`) y por plan.
- Crear/editar miembro (formulario con los campos de la tabla `members`).
- Vista de detalle de un miembro: datos personales, membresías (histórico), pagos (histórico), asistencia (histórico), botón para generar/reenviar su acceso al portal.
- Acción rápida "Congelar membresía" (pausa el conteo de vigencia) y "Reactivar".
- Exportar listado a CSV/Excel.

### 8.4 Planes de membresía (`/[orgSlug]/dashboard/planes`)
- CRUD de `membership_plans`.
- Al crear una membresía para un miembro, se elige el plan y se calcula automáticamente `end_date`.

### 8.5 Pagos — MVP con transferencia bancaria + pasarela opcional (`/[orgSlug]/dashboard/pagos`)

**Flujo principal (MVP, obligatorio):**
1. El club configura en `/[orgSlug]/dashboard/configuracion/pagos` los datos de su(s) cuenta(s) bancaria(s) en Ecuador (banco, tipo de cuenta, número, titular, cédula/RUC) — esto se muestra al miembro cuando va a pagar.
2. El miembro (desde el portal o el staff desde el dashboard) registra un pago: monto, sube foto/PDF del comprobante (a bucket `payment-proofs`), número de referencia.
3. El pago queda `status = pending_review`.
4. Un `admin`/`owner`/`staff` revisa el comprobante en una bandeja tipo "pagos pendientes" y aprueba o rechaza (ver reglas en sección 6.3/6.4).
5. Historial completo de pagos filtrable por estado, método, rango de fechas, miembro.

**Fase 2 (pasarela automática):** integrar **Kushki** (recomendada sobre PayPhone porque soporta liquidación directa a banco/cooperativa ecuatoriana y cobro recurrente, ideal para membresías mensuales — ver comparativa en sección 8.5.1) para que el miembro pueda pagar con tarjeta directamente y el pago se apruebe automáticamente vía webhook, sin revisión manual. PayPhone queda como alternativa más simple (cobro por link/QR) si el cliente la prefiere por su comisión o UX.

**8.5.1 Notas de la pasarela (para cuando se implemente fase 2):**
- Kushki: SDK oficial + webhooks idempotentes, soporta 3DS, liquidación T+2/T+3 a banco local, comisión aprox. 2.95% + $0.25 por transacción exitosa.
- PayPhone: cobro por link/QR/número celular, sin costo fijo de integración, comisión aprox. 5% + IVA, liquidación a wallet propio (retiro a banco con costo adicional).
- El webhook de la pasarela debe ir en `app/api/webhooks/kushki/route.ts` (o `payphone`), validar la firma, y actualizar el `payment.status` a `approved` + disparar la misma lógica de la sección 6.3.

### 8.6 Recordatorios automáticos por WhatsApp (`/[orgSlug]/dashboard/configuracion/whatsapp`)
- Conexión: Twilio WhatsApp Business API en el MVP (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, número de WhatsApp aprobado por Twilio).
- Plantillas editables por club (con variables `{{nombre}}`, `{{monto}}`, `{{fecha_vencimiento}}`, `{{link_pago}}`) para: bienvenida, recordatorio previo, recordatorio de vencido, confirmación de pago, anuncio general.
- Job programado (Vercel Cron diario, p. ej. 8:00am hora Ecuador) que recorre `payment_reminders` con `scheduled_at <= now()` y `status = 'scheduled'`, envía el mensaje, y marca `sent`/`failed`.
- Pantalla para enviar un **anuncio manual** a todos los miembros activos o a un segmento filtrado (ej. "solo plan mensual").
- Requiere que el club tenga una cuenta de WhatsApp Business verificada — documentar este requisito claramente en el onboarding, ya que Twilio/Meta piden verificación de negocio (puede tardar días); mientras tanto, el sistema debe funcionar igual, solo que los envíos de WhatsApp fallan silenciosamente con log de error hasta que se conecte la cuenta.

### 8.7 Control de acceso / asistencia por QR (`/[orgSlug]/dashboard/asistencia`)
- Cada `member` tiene un `qr_code` único generado al crearse.
- Pantalla "modo kiosco" (`/[orgSlug]/checkin`) pensada para una tablet en la entrada: cámara web escanea el QR (librería `html5-qrcode` o similar), valida membresía vigente (regla 6.5), registra en `attendance`, muestra en pantalla grande "¡Bienvenido, {{nombre}}!" o el mensaje de error correspondiente, con sonido/color (verde/rojo).
- El miembro también puede mostrar su QR desde el portal (para que el staff lo escanee con el celular si no hay kiosco).
- Dashboard de asistencia: gráfico de check-ins por día/semana, horas pico, ranking de asistencia por miembro.

### 8.8 Clases y horarios (`/[orgSlug]/dashboard/clases`)
- CRUD de `classes` con regla de recurrencia (días de la semana + horario).
- Generación automática de `class_sessions` para las próximas N semanas (job o al crear la clase).
- Miembros reservan cupo desde el portal (respetando `capacity`); staff puede reservar/marcar asistencia manualmente.
- Vista de calendario semanal para el dashboard del club y para el entrenador.

### 8.9 Gestión de staff y entrenadores (`/[orgSlug]/dashboard/equipo`)
- Invitar por email a un usuario con rol `admin`, `staff` o `trainer` (crea fila `organization_members` con `status = invited`, envía email con link para crear su contraseña).
- Editar/revocar accesos.

### 8.10 Dashboard y reportes (`/[orgSlug]/dashboard`)
KPIs principales (tarjetas + gráficas, seguir el skill de `dataviz` para consistencia visual si se usa en este proyecto):
- Recaudo del mes actual vs. mes anterior.
- Miembros activos / nuevos / vencidos este mes.
- Pagos pendientes de revisión (con acceso directo a la bandeja).
- Tasa de asistencia (check-ins / miembros activos).
- Próximos vencimientos (7 días).
Reportes exportables (CSV): miembros, pagos, asistencia, por rango de fechas.

### 8.11 Suscripción SaaS del propio club (`/[orgSlug]/dashboard/configuracion/suscripcion`)
- Solo visible para `owner`.
- Muestra el plan actual (`subscription_plans`), fecha de renovación, y permite cambiar de plan.
- Pago de esta suscripción: mismo mecanismo de transferencia bancaria manual en el MVP (el `platform_admin` aprueba el pago de la suscripción del club, tabla separada o reutilizando `payments` con `organization_id` apuntando a una "organización especial" de la plataforma — decidir la más simple al implementar; si hay duda, usar una tabla `platform_payments` calcada de `payments` para no mezclar dinero del club con dinero de la plataforma).

### 8.12 Panel super-admin de la plataforma (`/admin`)
- Solo accesible a usuarios en `platform_admins`.
- Lista de todos los clubes con su estado, plan, fecha de registro, último pago.
- Métricas globales: MRR, clubes activos, clubes en trial, churn.
- Acción para suspender/reactivar un club manualmente.
- Gestión de `subscription_plans` (crear/editar planes que se ofrecen a los clubes).

### 8.13 Configuración del club (`/[orgSlug]/dashboard/configuracion`)
- Datos generales (nombre, logo, color primario, teléfono, dirección).
- Datos bancarios para recibir transferencias (sección 8.5).
- Plantillas de WhatsApp (sección 8.6).
- Gestión de equipo (sección 8.9).
- Suscripción (sección 8.11).

### 8.14 (Fase 3 — opcional, no MVP) Asistente con IA tipo "Controli"
- Chat de soporte dentro del dashboard que responde preguntas frecuentes del staff sobre cómo usar la plataforma, y/o responde consultas simples de miembros por WhatsApp (horarios, cómo pagar).
- Implementar con la API de Claude o similar, con function-calling limitado a consultas de lectura (nunca acciones destructivas automáticas).
- No implementar hasta que el núcleo esté estable y en uso real.

### 8.15 (Fase 3 — opcional, no MVP) Gamificación tipo "ClubPoints"
- Puntos por asistencia/racha, tabla de posiciones por club.
- Solo si el cliente lo pide explícitamente después del MVP.

---

## 9. Estructura de carpetas sugerida

```
/app
  /(marketing)/page.tsx                  → landing pública
  /auth/login/page.tsx
  /auth/registro/page.tsx
  /auth/recuperar/page.tsx
  /admin/...                             → panel super-admin plataforma
  /[orgSlug]/dashboard/page.tsx          → KPIs
  /[orgSlug]/dashboard/miembros/...
  /[orgSlug]/dashboard/planes/...
  /[orgSlug]/dashboard/pagos/...
  /[orgSlug]/dashboard/asistencia/...
  /[orgSlug]/dashboard/clases/...
  /[orgSlug]/dashboard/equipo/...
  /[orgSlug]/dashboard/configuracion/...
  /[orgSlug]/portal/...                  → self-service del miembro
  /[orgSlug]/checkin/page.tsx            → modo kiosco QR
  /api/webhooks/kushki/route.ts
  /api/webhooks/payphone/route.ts
  /api/webhooks/twilio/route.ts          → mensajes entrantes de WhatsApp (opcional fase 2)
  /api/cron/reminders/route.ts           → job diario de recordatorios
  /api/cron/expire-memberships/route.ts  → job diario de vencimientos
/components
  /ui/...                                → shadcn/ui
  /dashboard/...
  /portal/...
/lib
  /supabase/{client.ts,server.ts,middleware.ts}
  /whatsapp/{twilio.ts,templates.ts}
  /payments/{kushki.ts,payphone.ts,bank-transfer.ts}
  /validations/*.ts                      → esquemas zod
/supabase
  /migrations/*.sql
  /seed.sql
/tests
  /unit/...
  /e2e/...
```

---

## 10. Diseño / UX

- Mobile-first: el staff de recepción y los miembros van a usar esto mayormente desde el celular.
- Paleta de colores: usar una paleta neutra placeholder (azul primario `#0EA5E9`, grises neutros, verde/rojo semánticos para estados aprobado/rechazado/vencido) — el color primario debe ser configurable por club (`organizations.primary_color`) para poder aplicar marca blanca en el futuro.
- Componentes: shadcn/ui con Tailwind, siguiendo un único sistema de diseño consistente entre dashboard y portal.
- Estados vacíos (empty states) claros en cada listado ("Aún no tienes miembros registrados, crea el primero").
- Mensajes de error siempre en español, claros y accionables (no mostrar errores técnicos crudos al usuario final).
- La app debe pasar Lighthouse PWA installable y tener un manifest.json con ícono, nombre y color de tema.

---

## 11. Seguridad

### 11.1 Principios
- Nunca confiar solo en el filtro del frontend: toda query server-side filtra por `organization_id` explícitamente.
- `SUPABASE_SERVICE_ROLE_KEY` solo se usa en server actions/route handlers que corren en el servidor (jobs de cron, webhooks), **nunca** en código que llegue al cliente.
- Archivos subidos (comprobantes, logos, fotos) van a buckets privados de Supabase Storage con URLs firmadas de corta duración, no públicas.

### 11.2 Políticas RLS (patrón a replicar en cada tabla con `organization_id`)
```sql
alter table members enable row level security;

create policy "members_select_same_org"
on members for select
using (
  organization_id in (
    select organization_id from organization_members
    where user_id = auth.uid() and status = 'active'
  )
);

create policy "members_write_admin_roles"
on members for insert, update, delete
using (
  organization_id in (
    select organization_id from organization_members
    where user_id = auth.uid() and status = 'active' and role in ('owner','admin','staff')
  )
);
```
Replicar este patrón (ajustando qué roles pueden escribir) en: `membership_plans`, `memberships`, `payments`, `attendance`, `classes`, `class_sessions`, `class_bookings`, `notifications`, `payment_reminders`, `whatsapp_templates`.

Para `members` en el portal (self-service), agregar además una policy que permita a un `member.user_id = auth.uid()` leer/actualizar **solo su propia fila** y sus propios `payments`/`memberships`/`attendance`.

`platform_admins` tiene acceso total vía policies que chequean `exists (select 1 from platform_admins where id = auth.uid())`.

### 11.3 Auditoría
Toda acción sensible (aprobar/rechazar pago, suspender club, cambiar rol de un usuario, eliminar un miembro) se registra en `audit_logs`.

---

## 12. Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_APP_URL=

WHATSAPP_PROVIDER=twilio           # twilio | meta
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
META_WHATSAPP_TOKEN=
META_PHONE_NUMBER_ID=

KUSHKI_PUBLIC_MERCHANT_ID=
KUSHKI_PRIVATE_MERCHANT_ID=
PAYPHONE_TOKEN=
PAYPHONE_STORE_ID=

RESEND_API_KEY=

CRON_SECRET=
```

---

## 13. Datos de prueba (seed)

El seed (`supabase/seed.sql`) debe crear, para desarrollo local:
- 1 `platform_admin`.
- 2 `organizations` de ejemplo (para probar aislamiento multi-tenant).
- Para cada una: 1 `owner`, 2-3 `membership_plans`, 10-15 `members` con distintos estados, pagos en distintos estados (`pending_review`, `approved`, `rejected`), algunas `classes` con `class_sessions` generadas, y algunos registros de `attendance`.

---

## 14. Fases de desarrollo (orden obligatorio)

**Fase 0 — Setup**
Proyecto Next.js + Supabase conectado, autenticación básica funcionando, estructura de carpetas, migraciones iniciales de `organizations`, `organization_members`, `members`, deploy inicial a Vercel.

**Fase 1 — Núcleo administrativo (MVP mínimo usable)**
Módulos 8.1, 8.2, 8.3, 8.4. Un dueño de club puede registrarse, crear planes, y administrar miembros manualmente. Sin pagos ni WhatsApp todavía.

**Fase 2 — Cobros**
Módulo 8.5 completo (transferencia bancaria manual + bandeja de aprobación) y reglas de negocio de la sección 6 (1, 2, 3, 4). Este es el corazón del valor del producto — no avanzar a fase 3 sin esto funcionando end-to-end y probado.

**Fase 3 — WhatsApp**
Módulo 8.6. Recordatorios automáticos conectados al job diario.

**Fase 4 — Acceso y clases**
Módulos 8.7 y 8.8.

**Fase 5 — Portal del miembro + PWA**
Sección 7 completa + configuración PWA (manifest, instalable).

**Fase 6 — Panel de plataforma y suscripción SaaS**
Módulos 8.11 y 8.12 (necesario recién cuando se quiera vender a más de un club).

**Fase 7 — Opcional / a futuro**
Pasarela de pago automática (Kushki/PayPhone, sección 8.5 fase 2), IA (8.14), gamificación (8.15), subdominios por club.

---

## 15. Definition of Done (por módulo)

Un módulo se considera terminado cuando:
1. Las migraciones y políticas RLS están aplicadas y probadas (un usuario de un club no puede ver/editar datos de otro club — probar esto explícitamente).
2. La UI cubre los estados: cargando, vacío, error, éxito.
3. Funciona correctamente en mobile (viewport angosto) y desktop.
4. Las acciones sensibles quedan en `audit_logs`.
5. Existe al menos una prueba automatizada (unit o e2e) del flujo principal del módulo.
6. No hay texto en inglés visible para el usuario final (todo en español).

---

## 16. Fuera de alcance (explícitamente, para evitar scope creep)

- App móvil nativa (iOS/Android) — no en este alcance, solo PWA.
- Multi-idioma.
- Facturación electrónica / integración con el SRI de Ecuador (puede ser un requerimiento legal futuro, pero no está en este alcance — anotarlo como posible fase 8 si el cliente lo pide).
- Pagos en criptomonedas.
- Integración con Stripe (explícitamente descartado por el cliente).
