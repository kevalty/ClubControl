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

// CLAUDE.md 8.2: si el usuario pertenece a más de un club, ve un selector
// al entrar; si pertenece a uno solo, entra directo a su dashboard.
async function redirigirSegunClubes(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { data: userData } = await supabase.auth.getUser();
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organizations(slug)")
    .eq("user_id", userData.user?.id ?? "")
    .eq("status", "active");

  const slugs = (memberships ?? [])
    .map((m) => (m.organizations as unknown as { slug: string } | null)?.slug)
    .filter((slug): slug is string => !!slug);

  if (slugs.length === 1) {
    redirect(`/${slugs[0]}/dashboard`);
  }
  if (slugs.length > 1) {
    redirect("/auth/seleccionar-club");
  }
  // Sin clubes de staff: puede ser un member de portal (Fase 5) o una
  // cuenta recién creada sin organización todavía.
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
