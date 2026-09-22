"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function reservarCupo(
  orgSlug: string,
  sessionId: string,
  orgId: string,
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) {
    return { error: "Selecciona un miembro." };
  }

  const supabase = await createClient();

  const [{ data: session }, { count: reservados }] = await Promise.all([
    supabase
      .from("class_sessions")
      .select("id, classes(capacity)")
      .eq("id", sessionId)
      .single(),
    supabase
      .from("class_bookings")
      .select("id", { count: "exact", head: true })
      .eq("class_session_id", sessionId)
      .eq("status", "booked"),
  ]);

  const capacidad = (session?.classes as unknown as { capacity: number } | null)?.capacity ?? 0;
  if ((reservados ?? 0) >= capacidad) {
    return { error: "Ya no hay cupo disponible en esta clase." };
  }

  const { error } = await supabase.from("class_bookings").insert({
    class_session_id: sessionId,
    organization_id: orgId,
    member_id: memberId,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "Este miembro ya tiene un cupo en esta clase." : "No se pudo reservar el cupo.",
    };
  }

  revalidatePath(`/${orgSlug}/dashboard/clases/sesiones/${sessionId}`);
  return { ok: true };
}

export async function marcarAsistenciaClase(
  orgSlug: string,
  sessionId: string,
  bookingId: string,
  status: "attended" | "no_show" | "cancelled"
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("class_bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error) {
    return { error: "No se pudo actualizar la reserva." };
  }

  revalidatePath(`/${orgSlug}/dashboard/clases/sesiones/${sessionId}`);
  return { ok: true };
}

export async function marcarAsistencia(
  orgSlug: string,
  sessionId: string,
  orgId: string,
  memberId: string,
  estado: "attended" | "no_show" | "justified"
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("class_bookings")
    .select("id")
    .eq("class_session_id", sessionId)
    .eq("member_id", memberId)
    .maybeSingle();

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("class_bookings")
      .update({ status: estado })
      .eq("id", existing.id);
    if (error) return { error: "No se pudo actualizar la asistencia." };
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("class_bookings").insert({
      class_session_id: sessionId,
      organization_id: orgId,
      member_id: memberId,
      status: estado,
    });
    if (error) return { error: "No se pudo registrar la asistencia." };
  }

  revalidatePath(`/${orgSlug}/dashboard/clases/sesiones/${sessionId}`);
  return {};
}
