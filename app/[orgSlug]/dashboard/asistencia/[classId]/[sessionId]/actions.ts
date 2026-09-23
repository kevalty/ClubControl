"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function marcarAsistencia(
  orgSlug: string,
  sessionId: string,
  orgId: string,
  memberId: string,
  estado: "attended" | "no_show" | "justified"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: existing } = await sb
    .from("class_bookings")
    .select("id")
    .eq("class_session_id", sessionId)
    .eq("member_id", memberId)
    .maybeSingle();

  if (existing) {
    const { error } = await sb
      .from("class_bookings")
      .update({ status: estado })
      .eq("id", existing.id);
    if (error) return { error: "No se pudo actualizar la asistencia." };
  } else {
    const { error } = await sb.from("class_bookings").insert({
      class_session_id: sessionId,
      organization_id: orgId,
      member_id: memberId,
      status: estado,
    });
    if (error) return { error: "No se pudo registrar la asistencia." };
  }

  revalidatePath(`/${orgSlug}/dashboard/asistencia`);
  return {};
}
