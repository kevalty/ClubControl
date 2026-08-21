"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function actualizarPerfilPropio(
  orgSlug: string,
  memberId: string,
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const emergencyContactName = String(formData.get("emergencyContactName") ?? "").trim();
  const emergencyContactPhone = String(formData.get("emergencyContactPhone") ?? "").trim();

  if (phone.length < 7) {
    return { error: "Teléfono inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({
      phone,
      email: email || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_phone: emergencyContactPhone || null,
    })
    .eq("id", memberId);

  if (error) {
    return { error: "No se pudo actualizar tu perfil." };
  }

  revalidatePath(`/${orgSlug}/portal/perfil`);
  return { ok: true };
}
