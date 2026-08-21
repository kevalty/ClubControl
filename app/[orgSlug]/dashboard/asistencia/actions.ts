"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function registrarAsistenciaManual(
  orgSlug: string,
  orgId: string,
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) {
    return { error: "Selecciona un miembro." };
  }

  const supabase = await createClient();

  const { data: member } = await supabase
    .from("members")
    .select("status")
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    return { error: "Miembro no encontrado." };
  }
  if (member.status !== "active") {
    return { error: "Este miembro no tiene una membresía activa (CLAUDE.md §6.5)." };
  }

  const { error } = await supabase.from("attendance").insert({
    organization_id: orgId,
    member_id: memberId,
    method: "manual",
  });

  if (error) {
    return { error: "No se pudo registrar la asistencia." };
  }

  revalidatePath(`/${orgSlug}/dashboard/asistencia`);
  return { ok: true };
}
