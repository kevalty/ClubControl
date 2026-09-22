import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

// Cliente de servicio para buscar orgs por slug (bypasses RLS).
// Los slugs son públicos (están en la URL), así que leerlos no es un leak.
function createServiceSupabase() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// Refresca la sesión de Supabase en cada request y valida acceso a rutas
// de club (/[orgSlug]/...) contra organization_members. Ver CLAUDE.md 8.2.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/checkin") ||
    // Modo kiosco (CLAUDE.md §8.7): tablet en la entrada, sin login. La
    // credencial es el propio código QR de cada miembro, no una sesión.
    pathname.endsWith("/checkin") ||
    pathname.match(/^\/[^/]+\/inscripcion/) ||
    // Carnet digital (CLAUDE.md §8.7): acceso público con token qr_code en query param.
    pathname.match(/^\/[^/]+\/carnet\//) ||
    // PWA (CLAUDE.md §10): un visitante sin sesión (ej. la landing) también
    // tiene que poder descargar el manifest y registrar el service worker.
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js";

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Validación de pertenencia a organización para rutas /[orgSlug]/...
  const orgSlugMatch = pathname.match(
    /^\/(?!auth|admin|api|_next)([^/]+)(\/dashboard|\/portal|\/checkin|\/onboarding)/
  );
  if (user && orgSlugMatch) {
    const orgSlug = orgSlugMatch[1];
    // Usa service role para evitar que RLS filtre orgs de otros clubes.
    // El slug está en la URL pública, no es información sensible.
    const { data: org } = await createServiceSupabase()
      .from("organizations")
      .select("id")
      .eq("slug", orgSlug)
      .maybeSingle();

    if (!org) {
      return new NextResponse("Club no encontrado", { status: 404 });
    }

    const requiresStaffMembership =
      pathname.includes("/dashboard") || pathname.includes("/onboarding");
    const requiresPortalMembership = pathname.includes("/portal");

    if (requiresStaffMembership) {
      // Fetch role junto con id para poder aplicar restricciones RBAC del trainer.
      // Solo añade el campo extra; el costo es mínimo (misma query).
      const { data: membership } = await supabase
        .from("organization_members")
        .select("id, role")
        .eq("organization_id", org.id as string)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!membership) {
        return new NextResponse("No autorizado para este club", { status: 403 });
      }

      // Entrenadores no pueden acceder a rutas de pagos, planes, equipo ni
      // configuración. Redirigir a su dashboard en lugar de mostrar 403 (mejor UX).
      // Entrenadores pueden ver /miembros, /equipo (torneos) y /staff (solo lectura).
      // No pueden acceder a escritura de miembros (/nuevo, /editar), pagos, planes,
      // configuración, inscripciones, facturación ni WhatsApp.
      // No pueden crear nuevos equipos (/equipo/nuevo).
      const isTrainerRestrictedPath =
        membership.role === "trainer" &&
        (pathname.includes("/pagos") ||
          pathname.includes("/planes") ||
          pathname.includes("/configuracion") ||
          pathname.includes("/inscripciones") ||
          pathname.includes("/facturacion") ||
          pathname.includes("/whatsapp") ||
          pathname.match(/\/miembros\/nuevo/) !== null ||
          pathname.match(/\/miembros\/[^/]+\/editar/) !== null ||
          pathname.match(/\/equipo\/nuevo/) !== null);

      if (isTrainerRestrictedPath) {
        const url = request.nextUrl.clone();
        url.pathname = `/${orgSlug}/dashboard`;
        return NextResponse.redirect(url);
      }
    }

    if (requiresPortalMembership) {
      const { data: portalMember } = await supabase
        .from("members")
        .select("id")
        .eq("organization_id", org.id as string)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!portalMember) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
