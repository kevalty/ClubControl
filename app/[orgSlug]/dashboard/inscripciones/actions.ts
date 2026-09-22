"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function aprobarInscripcion(
  orgSlug: string,
  memberId: string,
  feeTypeId: string | null,
  locationId: string | null,
  classId: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) return { error: "Organización no encontrada." };

  const updates: Record<string, unknown> = {
    registration_status: "approved",
    status: "active",
  };
  if (feeTypeId) updates.fee_type_id = feeTypeId;
  if (locationId) updates.location_id = locationId;

  const { error } = await supabase
    .from("members")
    .update(updates)
    .eq("id", memberId)
    .eq("organization_id", org.id as string);
  if (error) return { error: "No se pudo aprobar la inscripción." };

  if (classId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: enrollError } = await (supabase as any).from("class_enrollments").insert({
      organization_id: org.id,
      class_id: classId,
      member_id: memberId,
      status: "active",
    });
    // Duplicate enrollment (23505) is acceptable — the member is already enrolled
    if (enrollError && enrollError.code !== "23505") {
      console.error("[aprobar] enrollError:", enrollError);
      return { error: "Miembro aprobado pero no se pudo asignar la clase. Asígnala manualmente desde el perfil del miembro." };
    }
  }

  revalidatePath(`/${orgSlug}/dashboard/inscripciones`);
  revalidatePath(`/${orgSlug}/dashboard/miembros/${memberId}`);
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
