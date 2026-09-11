"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function aprobarInscripcion(
  orgSlug: string,
  memberId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({ registration_status: "approved", status: "active" })
    .eq("id", memberId);
  if (error) return { error: "No se pudo aprobar la inscripción." };
  revalidatePath(`/${orgSlug}/dashboard/inscripciones`);
  return {};
}

export async function rechazarInscripcion(
  orgSlug: string,
  memberId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({ registration_status: "rejected", status: "inactive" })
    .eq("id", memberId);
  if (error) return { error: "No se pudo rechazar la inscripción." };
  revalidatePath(`/${orgSlug}/dashboard/inscripciones`);
  return {};
}
