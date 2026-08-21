"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Guarda (crea o actualiza) la plantilla PROPIA del club para una key dada.
// Si el club nunca la personalizó, se usa la plantilla global (organization_id
// null) como valor por defecto en el formulario, pero al guardar se crea/
// actualiza siempre la fila específica de esta organización.
export async function guardarPlantilla(
  orgSlug: string,
  orgId: string,
  key: string,
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) {
    return { error: "La plantilla no puede estar vacía." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("whatsapp_templates")
    .select("id")
    .eq("organization_id", orgId)
    .eq("key", key)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("whatsapp_templates")
        .update({ content })
        .eq("id", existing.id)
    : await supabase.from("whatsapp_templates").insert({
        organization_id: orgId,
        key,
        content,
      });

  if (error) {
    return { error: "No se pudo guardar la plantilla." };
  }

  revalidatePath(`/${orgSlug}/dashboard/configuracion/whatsapp`);
  return { ok: true };
}
