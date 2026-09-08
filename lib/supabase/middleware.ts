import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

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
    const { data: org } = await supabase
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
      const { data: membership } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", org.id as string)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!membership) {
        return new NextResponse("No autorizado para este club", { status: 403 });
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
