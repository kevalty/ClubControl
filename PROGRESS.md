# PROGRESS.md — Estado de construcción de GestorClub

> Este archivo se actualiza en cada paso significativo. Si el trabajo se
> interrumpe, lee este archivo primero para saber exactamente en qué fase/
> módulo se quedó, qué está hecho, qué falta y qué decisiones se tomaron.
> Fuente de verdad del alcance: [`CLAUDE.md`](./CLAUDE.md).

Última actualización: 2026-08-20 (sesión inicial — Fase 0 completada)

## Cómo leer este archivo
- ✅ Hecho y verificado (compila / migración aplicada / probado manualmente)
- 🚧 En progreso ahora mismo
- ⬜ No empezado
- ⚠️ Bloqueado — requiere una decisión o credencial del usuario

---

## Cómo levantar el entorno local (para retomar el trabajo)
1. Docker Desktop debe estar corriendo (en Windows, si no arrancó solo:
   `& "C:\Program Files\Docker\Docker\Docker Desktop.exe"` y esperar ~1 min).
2. `npx supabase start` (primera vez tarda varios minutos descargando
   imágenes; luego es rápido). Verificar con `npx supabase status`.
3. Las credenciales del Supabase local ya están en `.env.local` (gitignored,
   no se recrea solo — si se borra, sacar los valores de `supabase status`
   y pegarlos según el formato de `.env.example`).
4. `npm run dev` → http://localhost:3000
5. Si se agregan/cambian migraciones: `npx supabase db reset` (reaplica todo
   + seed) y luego `npx supabase gen types typescript --local > lib/supabase/database.types.ts`.

## Resumen de fase actual

**FASE 0 — Setup: ✅ completada.**
**FASE 1 — Núcleo administrativo: ✅ completada.**
**FASE 2 — Cobros: ✅ completada.**
**Siguiente: FASE 3 — WhatsApp (módulo 8.6).**

---

## Fase 0 — Setup

Objetivo (CLAUDE.md §14): proyecto Next.js + Supabase conectado, auth básica
funcionando, estructura de carpetas, migraciones iniciales de
`organizations`, `organization_members`, `members`, deploy inicial a Vercel.

- ✅ Repo git inicializado (`main`), commit inicial con `CLAUDE.md`.
- ✅ Next.js 14+ (App Router) + TypeScript + Tailwind scaffolded con `create-next-app`.
- ✅ Dependencias instaladas: `@supabase/supabase-js`, `@supabase/ssr`, `zod`,
  `react-hook-form`, `@hookform/resolvers`, `supabase` (CLI, devDependency).
- ✅ Estructura de carpetas creada según CLAUDE.md §9 (`app/`, `components/`,
  `lib/`, `tests/`, subcarpetas de auth/dashboard/portal/admin).
- ✅ `lib/supabase/client.ts` (browser client), `server.ts` (server
  components/actions), `service.ts` (service-role, solo servidor),
  `middleware.ts` (helper de refresco de sesión + guard de `/[orgSlug]/dashboard`).
- ✅ `middleware.ts` raíz conectado al helper.
- ✅ Migración `20260820000001_platform_and_organizations.sql`: `platform_admins`,
  `subscription_plans`, `organizations`, `organization_subscriptions`,
  `organization_members`, funciones `private.is_platform_admin()`,
  `private.user_org_ids()`, `private.user_org_role()`, RLS completo.
- ✅ Migración `20260820000002_members.sql`: tabla `members` + RLS (staff ve
  todo su club, member ve/edita solo su propia fila).
- ✅ `supabase/seed.sql` inicial con los 4 `subscription_plans` (trial, básico,
  pro, ilimitado) — necesario para que el registro de club (Fase 1, módulo
  8.1) pueda asignar el plan `trial` al crear una organización.
- ✅ Supabase local levantado con Docker (`supabase start`; Docker Desktop no
  estaba corriendo al inicio, se lanzó manualmente). Migraciones y seed
  aplicados sin errores. Credenciales guardadas en `.env.local` (gitignored).
- ✅ Tipos reales generados: `npx supabase gen types typescript --local` →
  `lib/supabase/database.types.ts` (ya no es el placeholder).
- ✅ shadcn/ui `init` + componentes base añadidos: button, input, label, card,
  table, badge, select, dialog, dropdown-menu, avatar, separator, tabs,
  skeleton, alert, toast, sonner.
  - ⚠️ El componente `form` del registro de shadcn no se pudo instalar (el
    comando corrió sin error pero no generó el archivo — posible
    incompatibilidad de esta versión del CLI/registro). Se usará
    `react-hook-form` + `zod` directamente sin el wrapper `<Form>` de
    shadcn hasta investigarlo: no bloquea nada, solo es menos "bonito" el
    manejo de errores de formulario.
  - Nota: `Button` en esta versión de shadcn usa `@base-ui/react` y **no**
    soporta el patrón `asChild` de Radix. Para botones que son enlaces, se
    usa `buttonVariants({...})` aplicado directamente a `<Link>` (ver
    `app/page.tsx`) en vez de `<Button asChild>`.
- ✅ `.env.example` con las variables de §12 + `.env.local` con credenciales
  del Supabase local (`.gitignore` ajustado para permitir `.env.example` en
  el repo pero seguir ignorando `.env.local`).
- ✅ Auth básica: `/auth/login` funcional contra Supabase Auth
  (`app/auth/actions.ts` con server actions `login`/`logout`).
  Placeholders (sin lógica, solo UI + link de vuelta) en `/auth/registro` y
  `/auth/recuperar` — su implementación real es el módulo 8.1/8.2 en Fase 1.
- ✅ Landing (`/`) mínima en español con botones "Crear mi club" / "Ya tengo
  cuenta".
- ✅ `npm run build` compila sin errores (Next.js 16.3.1 — satisface "14+").
  Next 16 deprecó la convención `middleware.ts` a favor de `proxy.ts`; se
  corrió el codemod oficial (`@next/codemod middleware-to-proxy`) y el
  archivo raíz ahora es `proxy.ts` con `export function proxy(...)`.
- ✅ **Prueba manual explícita de aislamiento multi-tenant (RLS)**, requerida
  por la Definition of Done §15.1: se crearon 2 clubes de prueba (Club A,
  Club B) directamente en Postgres local, se simuló la sesión del owner de
  Club A (`set local "request.jwt.claims"`) y se confirmó que:
  - Solo ve `organizations` de su propio club (1 fila, Club A).
  - Solo ve `members` de su propio club.
  - 0 filas al intentar leer `organization_members` de Club B.
  - Script de la prueba queda documentado en este PROGRESS.md para poder
    repetirla tras cada migración nueva (ver "Cómo repetir la prueba RLS" abajo).
- 🐛 **Bug real encontrado y corregido durante la prueba de RLS**: las
  políticas RLS estaban bien escritas pero las tablas no tenían los `GRANT`
  de Postgres a nivel de tabla para el rol `authenticated` (RLS filtra
  *filas*, pero sin el `GRANT` de tabla el acceso se deniega antes de que
  RLS se evalúe). Sin este fix, **ningún usuario logueado podría leer nada**
  a pesar de que las políticas RLS eran correctas — habría parecido "todo
  roto" en cuanto se conectara el frontend. Se agregaron los `GRANT`
  correspondientes a `authenticated` y `service_role` en ambas migraciones
  y se volvió a correr `supabase db reset` + la prueba (ahora pasa).
  **Lección para futuras migraciones**: todo `create table` con RLS debe ir
  acompañado de sus `grant` explícitos en la misma migración, no asumir que
  Supabase los añade automáticamente en migraciones manuales.
- ✅ Smoke test manual con `supabase gen types` + `npm run dev`:
  `/` → 200, `/auth/login` → 200, `/club-a/dashboard` sin sesión → 307
  (redirige a login, confirma que el `proxy.ts` protege rutas de dashboard).
- ✅ Commits de Fase 0 (3, pequeños y descriptivos):
  1. `chore(fase-0): scaffold Next.js 14+ App Router + TypeScript + Tailwind + shadcn/ui`
  2. `feat(fase-0): conectar Supabase (clients, middleware, migraciones organizations/organization_members/members con RLS)`
  3. `docs(fase-0): actualizar PROGRESS.md` (este commit)
- ⬜ `manifest.json` PWA — se deja explícitamente para Fase 5 (no es parte de
  la Definition of Done de Fase 0, y CLAUDE.md lo agrupa con el portal).
- ⚠️ **Deploy a Vercel**: requiere cuenta de Vercel del usuario (login,
  posible vinculación de repo GitHub) — acción externa/irreversible que no
  se ejecuta sin confirmación explícita. El código ya compila limpio y está
  listo para desplegar en cuanto el usuario lo autorice; falta conectar el
  repo (aún no hay remoto de git configurado, solo el repo local).
- ⚠️ **Supabase hosted (proyecto real en la nube)**: para producción se
  necesita un proyecto Supabase real con sus propias credenciales (no las
  locales de Docker). Documentado como pendiente manual — mientras tanto
  todo el desarrollo y las pruebas ocurren contra el Supabase local
  (`supabase start`, requiere Docker Desktop corriendo).

### Cómo repetir la prueba de aislamiento RLS
```powershell
# Con Docker + supabase local corriendo:
Get-Content ruta\a\rls_isolation_test.sql | docker exec -i supabase_db_controllaclub psql -U postgres -d postgres
```
El script (`INSERT`s de prueba envueltos en `BEGIN; ... ROLLBACK;`, no deja
datos) no está commiteado al repo por ser un script de prueba manual ad-hoc;
si se quiere conservar como prueba repetible formal, migrar su lógica a
`tests/e2e` con Playwright cuando se implemente el módulo 8.2 (Fase 1) — ahí
sí correspondería un test automatizado real, no un script SQL suelto.

### Decisiones tomadas en Fase 0 (no ambiguas en el spec, pero registradas)
- ORM: se usa el cliente de Supabase JS + tipos generados por
  `supabase gen types typescript` (opción "simple" que el propio CLAUDE.md
  ofrece como alternativa a Drizzle) — evita una capa extra de abstracción.
- `AGENTS.md` generado automáticamente por `create-next-app`/`next dev` se
  conserva (es regenerado por Next.js mismo, no interferir).
- Las tablas de plataforma (`platform_admins`, `subscription_plans`,
  `organization_subscriptions`) se crearon junto con `organizations` y
  `organization_members` en Fase 0 (aunque los módulos 8.11/8.12 que las
  *usan* son Fase 6), porque son tablas fundacionales referenciadas por FK
  desde el día uno y evitan migraciones de churn más adelante.
- RLS de `organization_members` usa funciones `security definer` en schema
  `private` para evitar recursión de políticas sobre sí misma (patrón
  estándar recomendado por Supabase, más robusto que subconsultas directas).

---

## Fase 1 — Núcleo administrativo (MVP mínimo usable)
Módulos 8.1, 8.2, 8.3, 8.4. **Estado: ✅ completa.** Un dueño de club puede
registrarse, completar el onboarding, crear planes y administrar miembros —
todo probado con Playwright contra Supabase local. Sin pagos ni WhatsApp
todavía (eso es Fase 2 y 3), tal como pide CLAUDE.md §14.

### 8.1 Registro y onboarding — ✅ completo y probado end-to-end
- `/auth/registro`: formulario real (nombre club, nombre dueño, email,
  teléfono, contraseña) → `app/auth/registro/actions.ts` (`registrarClub`).
- Crea: `auth.users` (signUp), `organizations` (status `trial`,
  `trial_ends_at` +14 días), `organization_members` (owner), busca el plan
  `trial` en `subscription_plans` y crea `organization_subscriptions`, y un
  `audit_logs` (`organization.created`).
- Slug único: se genera con `lib/slug.ts` y, si hay colisión (Postgres
  `23505`), reintenta con sufijo aleatorio (hasta 5 intentos).
- Wizard de onboarding en `/[orgSlug]/onboarding` (`app/[orgSlug]/onboarding/`),
  3 pasos como pide CLAUDE.md: (1) dirección + color de marca (logo se deja
  para Configuración — TODO anotado en el código), (2) primer plan de
  membresía, (3) invitar primer colaborador (**opcional**, botón "Saltar
  por ahora").
- Invitación de staff usa `supabase.auth.admin.inviteUserByEmail` (Admin
  API, service_role) porque `organization_members.user_id` es `NOT NULL` —
  no se puede crear la fila "invited" sin que exista ya el usuario en
  `auth.users`. Página de aceptación de invitación real es del módulo 8.9
  (sin fase numerada en CLAUDE.md, ver sección de pendientes).
- **Prueba automatizada (Playwright, `tests/e2e/registro.spec.ts`)**: registra
  un club con datos únicos, completa los 3 pasos del wizard, verifica que
  termina en `/dashboard` y que el plan creado aparece en `/planes`. ✅ Pasa.

### 🐛 Bugs reales encontrados y corregidos durante las pruebas de 8.1
Los tres iban a romper el registro de **cualquier** club nuevo en cuanto se
conectara la UI real — el `error.message` inicial que veía el usuario iba a
ser genérico ("No se pudo crear el club") sin pista del problema real. Se
listan en detalle porque el patrón se repite en otras tablas nuevas:

1. **GRANT faltante** (ya documentado en Fase 0) — RLS sin `grant` de tabla
   a `authenticated` deniega todo antes de evaluar las policies.
2. **`INSERT ... RETURNING` sobre una fila que la propia policy de SELECT
   todavía no deja ver**: el código original hacía
   `.insert({...}).select("id, slug").single()` sobre `organizations`, pero
   la policy de SELECT exige ya ser miembro del club — y ese vínculo
   (`organization_members`) se crea recién en el paso siguiente. Postgres
   reporta esto como si el INSERT violara RLS (mensaje idéntico al de un
   `WITH CHECK` fallido), lo cual es engañoso. **Fix**: generar el `id` del
   lado del cliente (`crypto.randomUUID()`) e insertar sin encadenar
   `.select()`, ya que igualmente conocíamos el `slug` que estábamos
   insertando. **Lección**: cualquier `.insert().select()` sobre una tabla
   nueva hay que probarlo con el usuario "recién nacido" (sin membresías
   todavía), no solo con un usuario ya establecido.
3. **Recursión infinita de RLS (`42P17`)** en la policy de INSERT de
   `organization_members`: la cláusula de "bootstrap" (permitir el primer
   owner de un club nuevo) usaba una subconsulta directa
   `not exists (select 1 from organization_members om where ...)` **contra
   la misma tabla que la policy protege** — eso reevalúa la propia policy
   para cada fila candidata de la subconsulta → recursión. **Fix**: se
   extrajo a una función `security definer`
   (`private.org_has_no_members(org_id)`), igual que ya se hacía con
   `user_org_ids()`/`user_org_role()`. **Lección para toda policy futura**:
   nunca hacer una subconsulta cruda contra la tabla que la propia policy
   protege — siempre pasar por una función `security definer` en el schema
   `private`.

### 8.4 Planes de membresía — ✅ completo
- `/[orgSlug]/dashboard/planes`: listado (tabla, estado vacío, badge
  activo/inactivo), `/nuevo` y `/[planId]/editar` (formulario compartido en
  `plan-form.tsx`).
- "Eliminar" un plan en realidad lo desactiva (`is_active = false`) en vez
  de borrarlo de la BD — `memberships.plan_id` referencia el plan y
  borrarlo rompería el histórico de membresías ya vendidas. Se decidió sin
  preguntar por ser la opción más simple y segura (CLAUDE.md instrucción
  #5); el botón dice "Desactivar/Activar", no "Eliminar", para ser honesto
  sobre el comportamiento real.
- Reutiliza el mismo patrón de plan del paso 2 del onboarding.

### Infraestructura de testing (requisito de CLAUDE.md §2)
- `vitest` + `@testing-library/react` + `jsdom` instalados y configurados
  (`vitest.config.ts`, `npm run test:unit`). Primera prueba real:
  `tests/unit/slug.test.ts` (normalización de acentos, espacios, guiones).
- `@playwright/test` instalado con Chromium (`playwright.config.ts`,
  `npm run test:e2e`, arranca `npm run dev` solo si no hay uno corriendo).
  `tests/e2e/login.spec.ts` (error de credenciales, redirect sin sesión) y
  `tests/e2e/registro.spec.ts` (flujo completo 8.1+8.4). Todas pasan.
- Nota de instalación: `npm install` de los paquetes de testing chocó con
  peer deps de `shadcn`/Vite 8-rc (`ERESOLVE`); se instaló con
  `--legacy-peer-deps`. No debería afectar producción (son solo devDependencies).

### Componentes UI compartidos nuevos
- `components/ui/link-button.tsx`: el `Button` de esta versión de shadcn
  (`@base-ui/react`) **no soporta `asChild`** (a diferencia de Radix). Este
  wrapper reemplaza `<Button asChild><Link>...</Link></Button>` en toda la
  app — usarlo siempre que se necesite un enlace con pinta de botón.
- `<Toaster />` (sonner) montado en `app/layout.tsx` para poder usar
  `toast.error(...)` desde cualquier client component (usado en
  `plan-activo-toggle.tsx`).

### 8.2 Auth y roles — ✅ completo
- Login funcional (Fase 0). Middleware protege `/dashboard` y `/onboarding`
  verificando `organization_members.status = 'active'`.
- Recuperación de contraseña: `/auth/recuperar` (pide correo, siempre
  responde el mismo mensaje de éxito para no filtrar qué correos existen) →
  `/auth/actualizar-password` (client component: el link del correo trae la
  sesión en el fragmento de la URL `#access_token=...`, que el navegador
  procesa solo — por eso esa página específica no puede ser server
  component). Localmente el correo se ve en Mailpit (`supabase status` →
  `MAILPIT_URL`, http://127.0.0.1:54324) sin necesitar Resend configurado.
  **Para producción**: hay que configurar el SMTP de Supabase Auth
  (`[auth.email.smtp]` en `supabase/config.toml`, o el dashboard del
  proyecto hosted) para que use Resend con `RESEND_API_KEY` — sin esto los
  correos de recuperación no van a salir realmente.
- Selector de club (`/auth/seleccionar-club`): tras iniciar sesión,
  `app/auth/actions.ts` cuenta cuántos `organization_members` activos tiene
  el usuario — 1 → entra directo a `/{slug}/dashboard`; más de 1 → ve el
  selector; 0 → se queda en la landing (todavía no hay portal de member,
  eso es Fase 5).
- `supabase/config.toml`: `site_url` se cambió a `http://localhost:3000`
  (antes `127.0.0.1`) para que coincida con la URL que usan tanto la app
  (`.env.local`) como los tests de Playwright — si no coinciden
  exactamente, Supabase Auth rechaza el `redirectTo` del correo de
  recuperación silenciosamente.
- **Prueba automatizada**: `tests/e2e/login.spec.ts` ahora también cubre
  registro → completar onboarding → cerrar sesión → volver a entrar → cae
  directo en `/dashboard` (caso de un solo club).

### 8.3 Gestión de miembros — ✅ completo
- `/[orgSlug]/dashboard/miembros`: listado con búsqueda (nombre, teléfono,
  cédula vía `ilike` con `.or()`) y filtro por estado, estados
  vacío/error, exportar a CSV (`/miembros/export`, route handler con BOM
  UTF-8 para que Excel en Windows muestre bien los acentos).
- Crear/editar (`/nuevo`, `/[memberId]/editar`, formulario compartido
  `miembro-form.tsx`).
- Detalle (`/[memberId]`): datos personales, histórico de membresías (join
  con `membership_plans`), placeholders con TODO para pagos (Fase 2) y
  asistencia (Fase 4) ya que esas tablas todavía no tienen datos que mostrar.
- Acciones rápidas: Congelar/Reactivar (pausa `member.status` y las
  `memberships` activas — **TODO anotado en el código**: no extiende
  `end_date` automáticamente por los días congelados, confirmar con
  cliente si hace falta). Generar/reenviar acceso al portal (Admin API de
  Supabase, mismo patrón que la invitación de staff de 8.1). Eliminar
  (solo owner/admin, con diálogo de confirmación, auditado en
  `audit_logs` **antes** de borrar porque el `entity_id` deja de existir
  después del delete en cascada).
- **Prueba automatizada**: `tests/e2e/miembros.spec.ts` — crea club, crea
  miembro, lo busca, ve su detalle, congela y reactiva su membresía. Pasa.

### Checklist de Definition of Done (CLAUDE.md §15) para 8.1-8.4
1. Migraciones + RLS aplicadas y probadas explícitamente (Fase 0 y esta
   sesión) ✅. 2. Estados cargando/vacío/error/éxito cubiertos en listados y
   formularios ✅ (loading vía `pending` de `useActionState`/`useTransition`).
   3. Mobile: se usaron utilidades responsive de Tailwind en todo (grid/flex
   que colapsan), pero **no se verificó visualmente en un viewport angosto
   real** (no se abrió un navegador a mirar la pantalla, solo Playwright
   headless) — pendiente una pasada visual manual. 4. Acciones sensibles en
   `audit_logs`: creación de organización, eliminar miembro, otorgar acceso
   a portal ✅. 5. Prueba automatizada por módulo ✅ (Playwright). 6. Sin
   texto en inglés visible ✅ (revisado a simple vista, no exhaustivo).

## Fase 2 — Cobros
Módulo 8.5 (transferencia bancaria) + reglas §6.1-6.4. **Estado: ✅ completa.**

### Decisiones y desviaciones del esquema literal de CLAUDE.md §5 (documentadas, no ambiguas)
- **`bank_accounts` (tabla nueva, no está en §5)**: CLAUDE.md §8.5 pide que
  "el club configura... los datos de su(s) cuenta(s) bancaria(s)" pero §5
  nunca modela esa tabla. Se creó `bank_accounts` (banco, tipo, número,
  titular, cédula/RUC, `is_active`) — la opción más simple que soporta
  "cuenta(s)" en plural. RLS: staff lee las de su club; owner/admin
  escribe; member (portal, Fase 5) lee solo las activas.
- **`payments.plan_id` (columna nueva, no está en la tabla `payments` de
  §5)**: la regla §6.3 dice que al aprobar un pago hay que "crear O
  extender" la membresía. Si es una extensión, `membership_id` ya apunta a
  la membresía existente y de ahí se saca el plan. Pero si es la
  **primera** membresía de un miembro, no existe todavía ningún
  `membership_id` que crear — y sin un `plan_id` en el pago no hay forma
  de saber qué plan comprar al momento de aprobar. Se agregó `plan_id`
  (nullable, FK a `membership_plans`) como la solución mínima. Anotado en
  el propio SQL de la migración también, no solo acá.
- **`greatest(end_date, current_date) + duration_days`** en vez de la
  redacción literal `end_date += duration_days`: si un miembro paga mucho
  después de que su membresía venció, sumar `duration_days` a una
  `end_date` vieja la dejaría *igual de vencida*. Se decidió extender desde
  hoy si ya estaba vencida — comportamiento estándar en sistemas de
  membresía, más razonable que la lectura literal.
- **Lógica de aprobación/rechazo como funciones de Postgres**
  (`approve_payment`, `reject_payment` — `SECURITY INVOKER`, sin
  escalamiento de privilegios, corren con los permisos RLS de quien las
  llama) en vez de una secuencia de updates desde el server action: la
  regla §6.3 toca 4 tablas a la vez (payments, memberships, members,
  payment_reminders) + audit_logs — hacerlo atómico importa tratándose de
  dinero/acceso, y Postgres ya lo garantiza gratis dentro de una función.
- **Envío real de WhatsApp no existe todavía** (es Fase 3): tanto
  `approve_payment` como `reject_payment` insertan una fila en
  `payment_reminders` con `status = 'scheduled'` y `scheduled_at = now()`
  (confirmación de pago / aviso de rechazo). Quedan sin enviarse hasta que
  exista el cron de Fase 3 — es el comportamiento esperado, no un bug.
- **"Registrar pago" es una acción de staff, no self-service del miembro**:
  el portal del miembro (donde él mismo sube su comprobante) es Fase 5.
  Por ahora `owner/admin/staff` registran el pago desde el dashboard
  (`/pagos/nuevo`), opcionalmente con foto/PDF del comprobante. Las
  policies de RLS de `payments` y del bucket `payment-proofs` ya están
  preparadas para agregar el self-service del member más adelante sin
  tocar lo existente.

### Lo construido
- `/[orgSlug]/dashboard/configuracion/pagos`: CRUD simple de cuentas
  bancarias (crear, activar/desactivar).
- `/[orgSlug]/dashboard/pagos`: bandeja de pagos filtrable por estado
  (por defecto muestra "Pendiente de revisión") y método; aprobar/rechazar
  (con motivo opcional) llaman a las funciones RPC; "Ver comprobante" pide
  una URL firmada de 60 segundos (CLAUDE.md §11.1, nunca URLs públicas).
- `/[orgSlug]/dashboard/pagos/nuevo`: registra un pago para un miembro,
  eligiendo entre "renovar una membresía existente" o "plan nuevo" (carga
  todas las membresías del club una sola vez y filtra en el cliente por
  miembro seleccionado — evita un round-trip extra, razonable a la escala
  de un club).
- Ficha de miembro (8.3) ahora muestra el historial real de pagos.
- `/api/cron/expire-memberships`: regla §6.1, protegido con `CRON_SECRET`
  (401 sin el header correcto), usa el service-role client. Registrado en
  `vercel.json` para correr diario a las 10:00 UTC (~5am Ecuador).
  **Nota**: Vercel agrega automáticamente el header
  `Authorization: Bearer $CRON_SECRET` cuando esa env var está configurada
  en el proyecto — no hace falta configurar nada más ahí.

### Pruebas manuales y automatizadas
- **Prueba manual explícita del cron** (no tiene UI): se sembraron datos
  directo en Postgres local (un miembro con una membresía vencida hace 5
  días) y se llamó al endpoint con y sin el `CRON_SECRET` correcto — con
  el secreto: `membershipsExpired: 1, membersExpired: 1` y se verificó en
  la base que ambos quedaron `expired`; sin el secreto: `401`. Esa misma
  prueba se convirtió en automatizada real:
  `tests/e2e/cron-expire-memberships.spec.ts` (usa el fixture `request` de
  Playwright para sembrar vía REST de Supabase con la service_role key
  local y llamar al cron como lo haría Vercel — solo válido en este
  entorno local, nunca usar la service_role key así en producción).
- `tests/e2e/pagos.spec.ts`: flujo completo (crear cuenta bancaria, crear
  miembro sin membresía, registrar pago de un plan nuevo, aprobar → verifica
  que el miembro pasa a "Activo" y aparece la membresía) y flujo de rechazo
  (queda en "Rechazado", sin membresía creada). Los dos pasan.
- Suite completa tras Fase 2: **9 pruebas e2e + 3 unitarias, todas en verde.**

## Fase 3 — WhatsApp
Módulo 8.6. **Estado: ⬜ no empezado.**

## Fase 4 — Acceso y clases
Módulos 8.7, 8.8. **Estado: ⬜ no empezado.**

## Fase 5 — Portal del miembro + PWA
Sección 7 + PWA. **Estado: ⬜ no empezado.**

## Fase 6 — Panel de plataforma y suscripción SaaS
Módulos 8.11, 8.12. **Estado: ⬜ no empezado.**

## Fase 7 — Opcional / a futuro
Kushki/PayPhone, IA (8.14), gamificación (8.15), subdominios. **Estado: ⬜ no empezado.**

---

## Nota sobre módulos sin fase numerada explícita
CLAUDE.md §14 no asigna número de fase a los módulos 8.9 (staff/entrenadores),
8.10 (dashboard con KPIs) y 8.13 (configuración general). Decisión tomada
(instrucción #5 del propio CLAUDE.md — la más simple y razonable, anotada
acá en vez de detener el desarrollo): se construyen en el momento en que sus
prerequisitos ya existen y algún otro módulo los necesita de verdad, en vez
de una fase fija:
- 8.9 (invitar/gestionar staff): la parte de *crear* la invitación ya se
  adelantó de forma mínima dentro del wizard de 8.1 (Fase 1). Falta la
  página de gestión completa (`/equipo`) y el flujo de aceptación de
  invitación — se completa cuando haga falta un segundo rol de staff real
  probando el sistema, o al llegar a Fase 4 (asistencia/clases, que sí
  necesita `trainer`).
- 8.10 (KPIs del dashboard): necesita datos reales de pagos y asistencia
  para que las gráficas tengan sentido — se construye en o después de Fase 2.
- 8.13 (configuración general): es un contenedor de las secciones de
  bancos (8.5), WhatsApp (8.6), equipo (8.9) y suscripción (8.11) — se arma
  como layout de navegación cuando exista más de una de esas subpáginas.

## Pendientes que requieren al usuario (no se pueden resolver solos)
1. Cuenta de Vercel para el deploy real (Fase 0 lo deja listo, pero no se despliega sin autorización).
2. Proyecto Supabase hosted real (para producción — desarrollo usa Supabase local vía Docker).
3. Cuenta Twilio WhatsApp Business (Fase 3) — verificación de negocio puede tardar días, hay que iniciarla cuanto antes.
4. Cuentas Kushki/PayPhone (Fase 7, opcional).
5. Dominio final si se decide reemplazar el placeholder "GestorClub".

---

## Log de sesiones
- **2026-08-20**: Sesión inicial. Se leyó CLAUDE.md completo.
  - Fase 0 completada de punta a punta: scaffold Next.js/Tailwind/shadcn,
    Supabase local vía Docker, migraciones + RLS de
    `organizations`/`organization_subscriptions`/`organization_members`/
    `members`/`platform_admins`/`subscription_plans`, aislamiento
    multi-tenant verificado manualmente (bug de `GRANT` faltante
    encontrado y corregido), auth básica, build limpio.
  - Fase 1 completada de punta a punta (módulos 8.1, 8.2, 8.3, 8.4):
    registro/onboarding de club (wizard de 3 pasos), planes de membresía
    (CRUD), gestión de miembros (listado con búsqueda/filtros, CRUD,
    detalle, congelar/reactivar, acceso a portal, exportar CSV),
    recuperación de contraseña y selector de club multi-org. Se montó
    infraestructura de testing real (`vitest` + `Playwright`) y se
    encontraron/corrigieron dos bugs reales de RLS durante las pruebas
    (visibilidad de `RETURNING` antes de tener membresía, y recursión
    infinita de policy) — ambos documentados en detalle arriba porque el
    patrón se puede repetir en tablas futuras. 5 pruebas e2e y 3 unitarias,
    todas en verde. 15 commits en total en la sesión.
  - Fase 2 completada (módulo 8.5): cuentas bancarias, registrar/aprobar/
    rechazar pagos (como funciones de Postgres para atomicidad), cron de
    vencimiento de membresías (§6.1) probado manualmente y luego
    automatizado. Se agregaron dos columnas/tablas fuera del esquema
    literal de §5 (`bank_accounts`, `payments.plan_id`) porque la sección
    no alcanza a cubrir esos casos — documentado en detalle arriba y en
    los propios archivos de migración.
  - Siguiente paso: Fase 3 (módulo 8.6, recordatorios automáticos por
    WhatsApp vía Twilio) — ya hay `payment_reminders` y `whatsapp_templates`
    creados y poblándose (confirmación de pago, rechazo de comprobante)
    desde Fase 2, solo falta el envío real y los recordatorios de
    vencimiento (§6.2: 3 días antes, el día, y 1/3/7 días después).
