"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function reservarCupoPropio(
  orgSlug: string,
  memberId: string,
  sessionId: string
) {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("class_sessions")
    .select("id, organization_id, classes(capacity)")
    .eq("id", sessionId)
    .single();

  const { count: reservados } = await supabase
    .from("class_bookings")
    .select("id", { count: "exact", head: true })
    .eq("class_session_id", sessionId)
    .eq("status", "booked");

  if (!session) {
    return { error: "Sesión no encontrada." };
  }

  const capacidad = (session.classes as unknown as { capacity: number } | null)?.capacity ?? 0;
  if ((reservados ?? 0) >= capacidad) {
    return { error: "Ya no hay cupo disponible en esta clase." };
  }

  const { error } = await supabase.from("class_bookings").insert({
    class_session_id: sessionId,
    organization_id: session.organization_id,
    member_id: memberId,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "Ya tienes un cupo reservado en esta clase." : "No se pudo reservar el cupo.",
    };
  }

  revalidatePath(`/${orgSlug}/portal/clases`);
  return { ok: true };
}

export async function cancelarReservaPropia(orgSlug: string, bookingId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("class_bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (error) {
    return { error: "No se pudo cancelar la reserva." };
  }

  revalidatePath(`/${orgSlug}/portal/clases`);
  return { ok: true };
}
