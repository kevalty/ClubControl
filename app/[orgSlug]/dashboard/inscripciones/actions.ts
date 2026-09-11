"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function aprobarInscripcion(
  orgSlug: string,
  memberId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) return { error: "Organización no encontrada." };

  const { error } = await supabase
    .from("members")
    .update({ registration_status: "approved", status: "active" })
    .eq("id", memberId)
    .eq("organization_id", org.id);
  if (error) return { error: "No se pudo aprobar la inscripción." };
  revalidatePath(`/${orgSlug}/dashboard/inscripciones`);
  return {};
}

export async function rechazarInscripcion(
  orgSlug: string,
  memberId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) return { error: "Organización no encontrada." };

  const { error } = await supabase
    .from("members")
    .update({ registration_status: "rejected", status: "inactive" })
    .eq("id", memberId)
    .eq("organization_id", org.id);
  if (error) return { error: "No se pudo rechazar la inscripción." };
  revalidatePath(`/${orgSlug}/dashboard/inscripciones`);
  return {};
}
