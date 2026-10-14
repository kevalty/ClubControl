# Graph Report - controllaclub  (2026-10-14)

## Corpus Check
- 309 files · ~154,110 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .pid 1)

## Summary
- 931 nodes · 3239 edges · 60 communities (45 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- planes
- clubes
- actualizar-password
- [classId]
- PROGRESS
- ui
- plans
- clases
- package
- package
- components
- e2e
- clases
- supabase
- tsconfig
- [orgSlug]
- dashboard
- admin
- reminders
- [classId]
- asistencia
- package
- privacidad
- ui
- app
- planes
- checkin
- sedes
- facturacion
- inscripciones
- staff
- planes
- registro
- [memberId]
- rubros
- equipo
- package
- pagos
- [sessionId]
- validations
- [facturaId]
- content
- metricas
- clases
- package
- [familiaId]
- eslint.config
- export
- postcss.config
- public
- public
- ss
- vercel
- AGENTS
- public
- public
- public
- public
- public
- README

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 211 edges
2. `Button()` - 119 edges
3. `cn()` - 105 edges
4. `next` - 103 edges
5. `Input()` - 64 edges
6. `Label()` - 64 edges
7. `react` - 63 edges
8. `Alert()` - 59 edges
9. `AlertDescription()` - 58 edges
10. `SelectContent()` - 44 edges

## Surprising Connections (you probably didn't know these)
- `toggleSede()` --calls--> `createClient()`  [EXTRACTED]
  app/[orgSlug]/dashboard/configuracion/sedes/actions.ts → lib/supabase/server.ts
- `cambiarRolMiembro()` --calls--> `createClient()`  [EXTRACTED]
  app/[orgSlug]/dashboard/staff/actions.ts → lib/supabase/server.ts
- `revocarAcceso()` --calls--> `createClient()`  [EXTRACTED]
  app/[orgSlug]/dashboard/staff/actions.ts → lib/supabase/server.ts
- `subirLogoClub()` --calls--> `createClient()`  [EXTRACTED]
  app/[orgSlug]/onboarding/actions.ts → lib/supabase/server.ts
- `obtenerUrlComprobantePropio()` --calls--> `createClient()`  [EXTRACTED]
  app/[orgSlug]/portal/pagos/actions.ts → lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (60 total, 15 thin omitted)

### Community 0 - "planes"
Cohesion: 0.08
Nodes (95): NuevoPlanForm(), RegistrarAsistenciaForm(), ClaseForm(), ClaseFormValues, ReservarForm(), ClubSettingsForm(), PRESET_COLORS, FamiliaManager() (+87 more)

### Community 1 - "clubes"
Cohesion: 0.08
Nodes (54): alternarSuspensionClub(), AdminClubesPage(), SuspensionToggle(), AdminPagosPage(), AdminPlanesPage(), registrarAsistenciaManual(), AsistenciaPage(), ClasesPage() (+46 more)

### Community 2 - "actualizar-password"
Cohesion: 0.08
Nodes (53): AdminResumenPage(), ActualizarPasswordPage(), handleSubmit(), LoginPage(), solicitarRecuperacion(), RecuperarPage(), RegistroPage(), SeleccionarClubPage() (+45 more)

### Community 3 - "[classId]"
Cohesion: 0.13
Nodes (34): enrollMember(), unenrollMember(), AvailableMember, EnrolledMember, EnrollmentManager(), initials(), actualizarMiembro(), congelarMiembro() (+26 more)

### Community 4 - "PROGRESS"
Cohesion: 0.10
Nodes (24): approve_payment() — Postgres function (SECURITY INVOKER) for atomic payment approval, Attendance hierarchy UI — 3-level: classes → sessions → mark attendance, Carnet digital — public member card with QR, token-authenticated, no login, CLAUDE.md — GestorClub source of truth spec, Vercel Cron jobs — expire-memberships (10:00 UTC), reminders (13:00 UTC), generate-sessions (11:00 Mon UTC), Demo Guide — FENIX Riobamba September 2026, FENIX Feature Blocks Implementation Plan (2026-09-10), Features 11, 12 & 16 Implementation Plan (2026-09-22) (+16 more)

### Community 5 - "ui"
Cohesion: 0.11
Nodes (23): AlertAction(), AlertTitle(), Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage() (+15 more)

### Community 6 - "plans"
Cohesion: 0.10
Nodes (22): Storage Bucket: member-documents (private), Component: AprobarModal (approval modal with fee/location/class), Component: AttendancePanel (mobile-first, presente/ausente/justificado), DB Constraint: class_bookings.status extended with 'justified', FENIX Phase 2 — Implementation Plan, Route: /[orgSlug]/dashboard/equipo (tournament teams, renamed from staff), Route: /[orgSlug]/inscripcion (public registration form), Route: /[orgSlug]/dashboard/staff (staff management, moved from equipo) (+14 more)

### Community 7 - "clases"
Cohesion: 0.13
Nodes (16): AsistenciaClasesPage(), AsistenciaHistorialPage(), ClubSettingsPage(), agregarMiembroFamiliar(), crearGrupoFamiliar(), quitarMiembroFamiliar(), schema, NuevoGrupoPage() (+8 more)

### Community 8 - "package"
Cohesion: 0.09
Nodes (22): name, private, version, clsx, @hookform/resolvers, jsdom, react-dom, react-hook-form (+14 more)

### Community 9 - "package"
Cohesion: 0.09
Nodes (23): dependencies, @base-ui/react, class-variance-authority, clsx, @hookform/resolvers, html5-qrcode, lucide-react, next (+15 more)

### Community 10 - "components"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 11 - "e2e"
Cohesion: 0.10
Nodes (6): @playwright/test, headers, headers, headers, headers, headers

### Community 12 - "clases"
Cohesion: 0.19
Nodes (12): actualizarClase(), alternarActivaClase(), crearClase(), generarSesiones(), parseClassForm(), ClaseActivaToggle(), EditarClasePage(), NuevaClasePage() (+4 more)

### Community 13 - "supabase"
Cohesion: 0.14
Nodes (15): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+7 more)

### Community 14 - "tsconfig"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 15 - "[orgSlug]"
Cohesion: 0.20
Nodes (11): POST(), GET(), DAY_MAP, GET(), nextOccurrences(), GET(), InscripcionSchema, submitInscripcion() (+3 more)

### Community 16 - "dashboard"
Cohesion: 0.21
Nodes (13): DashboardLayout(), Notification, NotificationBell(), AnyNotification, DashboardShell(), buildGroups(), buildTrainerGroups(), DashboardSidebar() (+5 more)

### Community 17 - "admin"
Cohesion: 0.22
Nodes (12): AdminLayout(), NAV_ITEMS, login(), logout(), redirigirSegunClubes(), NAV_ITEMS, PortalLayout(), NavItem (+4 more)

### Community 18 - "reminders"
Cohesion: 0.23
Nodes (9): GET(), procesarRecordatorio(), enviarLinkInscripcion(), enviarAnuncio(), AnuncioPage(), toE164Ecuador(), renderTemplate(), sendWhatsAppMessage() (+1 more)

### Community 19 - "[classId]"
Cohesion: 0.14
Nodes (9): AsistenciaClaseSesionesPage(), DAY_NAMES, getSessionStatus(), AttendanceMember, DashboardHomePage(), Checkbox(), Separator(), Skeleton() (+1 more)

### Community 21 - "package"
Cohesion: 0.12
Nodes (16): devDependencies, eslint, eslint-config-next, jsdom, @playwright/test, supabase, tailwindcss, @tailwindcss/postcss (+8 more)

### Community 22 - "privacidad"
Cohesion: 0.16
Nodes (5): metadata, metadata, updateClubSettings(), nextConfig, next

### Community 23 - "ui"
Cohesion: 0.28
Nodes (12): toast, ToastAction(), ToastClose(), ToastContent(), ToastDescription(), Toaster(), ToastIcon(), ToastList() (+4 more)

### Community 24 - "app"
Cohesion: 0.23
Nodes (8): geistMono, geistSans, metadata, RootLayout(), viewport, PwaRegister(), Toaster(), next-themes

### Community 25 - "planes"
Cohesion: 0.29
Nodes (6): actualizarPlan(), alternarActivoPlan(), crearPlan(), NuevoPlanPage(), PlanActivoToggle(), EditarPlanPage()

### Community 26 - "checkin"
Cohesion: 0.31
Nodes (6): CheckinKiosk(), beep(), handleScan(), Resultado, CheckinPage(), html5-qrcode

### Community 27 - "sedes"
Cohesion: 0.28
Nodes (6): crearSede(), editarSede(), SedeSchema, toggleSede(), NuevaSedeePage(), EditarSedeePage()

### Community 28 - "facturacion"
Cohesion: 0.25
Nodes (6): crearFacturaSimulada(), FacturaSchema, NuevaFacturaPage(), pagoRapidoSchema, registrarPagoRapido(), zod

### Community 29 - "inscripciones"
Cohesion: 0.28
Nodes (7): aprobarInscripcion(), rechazarInscripcion(), handleConfirm(), AprobarRechazarButtons(), Clase, FeeType, Location

### Community 30 - "staff"
Cohesion: 0.25
Nodes (7): cambiarRolMiembro(), invitarMiembroEquipo(), invitarSchema, revocarAcceso(), EquipoPage(), ROLE_LABELS, STATUS_LABELS

### Community 31 - "planes"
Cohesion: 0.36
Nodes (5): alternarActivoPlanPlataforma(), crearPlanPlataforma(), PlanActivoTogglePlataforma(), SubscriptionPlanInput, subscriptionPlanSchema

### Community 32 - "registro"
Cohesion: 0.39
Nodes (4): registrarClub(), slugify(), RegistroInput, registroSchema

### Community 33 - "[memberId]"
Cohesion: 0.32
Nodes (6): CarnetView(), Member, Membership, Org, CarnetPage(), react-qr-code

### Community 34 - "rubros"
Cohesion: 0.32
Nodes (5): crearRubro(), editarRubro(), RubroSchema, NuevoRubroPage(), EditarRubroPage()

### Community 35 - "equipo"
Cohesion: 0.43
Nodes (4): agregarMiembroEquipoTorneo(), crearEquipo(), quitarMiembroEquipoTorneo(), teamSchema

### Community 36 - "package"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test:e2e, test:unit

### Community 37 - "pagos"
Cohesion: 0.73
Nodes (4): aprobarPagoPlataforma(), obtenerUrlComprobantePlataforma(), rechazarPagoPlataforma(), PagoPlataformaAcciones()

### Community 38 - "[sessionId]"
Cohesion: 0.47
Nodes (3): marcarAsistencia(), AsistenciaSessionPage(), AttendancePanel()

### Community 39 - "validations"
Cohesion: 0.40
Nodes (4): ClaseDetailPage(), ClassInput, classSchema, WEEKDAYS

### Community 40 - "[facturaId]"
Cohesion: 0.47
Nodes (4): VerFacturaPage(), Factura, Org, PrintFactura()

### Community 41 - "content"
Cohesion: 0.40
Nodes (4): Dashboard Mockup HTML, Estilo Cards HTML — KPI card variants (glassmorphism, solid-glow, minimal-dark), Estilo Visual HTML — visual personality options (dark-premium, clean-pro, vibrant), Layout Nav HTML — navigation layout options (sidebar-icons, sidebar-wide, topnav)

### Community 42 - "metricas"
Cohesion: 0.60
Nodes (3): MetricasPage(), StatusBadge(), toDateStr()

### Community 43 - "clases"
Cohesion: 0.80
Nodes (3): cancelarReservaPropia(), reservarCupoPropio(), ReservaBoton()

### Community 45 - "[familiaId]"
Cohesion: 0.50
Nodes (3): FamiliaDetailPage(), FamilyGroupRow, MemberRow

### Community 46 - "eslint.config"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

## Knowledge Gaps
- **41 isolated node(s):** `@hookform/resolvers`, `react-dom`, `react-hook-form`, `shadcn`, `tw-animate-css` (+36 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 268 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.