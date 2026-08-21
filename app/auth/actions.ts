"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent("Correo o contraseña incorrectos.")}`);
  }

  await redirigirSegunClubes(supabase);
}

// CLAUDE.md §8.2: si el usuario pertenece a más de un club, ve un selector
// al entrar; si pertenece a uno solo, entra directo (a su dashboard si es
// staff, a su portal si es member). Un mismo usuario podría en teoría ser
// staff de un club Y member de otro — se combinan ambas listas.
async function redirigirSegunClubes(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? "";

  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (platformAdmin) {
    redirect("/admin");
  }

  const [{ data: staffMemberships }, { data: portalMemberships }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("organizations(slug)")
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase.from("members").select("organizations(slug)").eq("user_id", userId),
  ]);

  const destinos = [
    ...(staffMemberships ?? []).map((m) => ({
      slug: (m.organizations as unknown as { slug: string } | null)?.slug,
      path: "dashboard",
    })),
    ...(portalMemberships ?? []).map((m) => ({
      slug: (m.organizations as unknown as { slug: string } | null)?.slug,
      path: "portal",
    })),
  ].filter((d): d is { slug: string; path: string } => !!d.slug);

  if (destinos.length === 1) {
    redirect(`/${destinos[0].slug}/${destinos[0].path}`);
  }
  if (destinos.length > 1) {
    redirect("/auth/seleccionar-club");
  }
  // Sin ningún club: cuenta recién creada sin organización todavía.
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
