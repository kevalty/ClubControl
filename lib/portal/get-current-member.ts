import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Resuelve la fila de `members` del usuario logueado para el club actual.
// El middleware ya garantiza que existe (ver lib/supabase/middleware.ts),
// esto es solo para tener los datos a mano en cada página del portal.
export async function getCurrentMember(orgSlug: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/auth/login");
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) {
    redirect("/");
  }

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("organization_id", org.id)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!member) {
    redirect("/");
  }

  return { supabase, org, member };
}
