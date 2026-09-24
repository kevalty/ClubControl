"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function updateClubSettings(
  orgSlug: string,
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) return { error: "Organización no encontrada." };

  const name = (formData.get("name") as string | null)?.trim();
  if (!name || name.length < 2) return { error: "El nombre debe tener al menos 2 caracteres." };

  const primaryColor = (formData.get("primaryColor") as string | null) ?? "#6366f1";
  const logoFile = formData.get("logo") as File | null;

  const updates: Record<string, unknown> = { name, primary_color: primaryColor };

  if (logoFile && logoFile.size > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serviceClient = createServiceClient() as any;
    const ext = logoFile.name.split(".").pop() ?? "png";
    const path = `${org.id}/logo.${ext}`;
    const { error: uploadError } = await serviceClient.storage
      .from("org-logos")
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type });
    if (uploadError) {
      console.error("[updateClub] logo upload error:", uploadError);
      return { error: "No se pudo subir el logo. Verifica que sea una imagen válida." };
    }
    // org-logos bucket is public — build the public URL
    const { data: { publicUrl } } = serviceClient.storage
      .from("org-logos")
      .getPublicUrl(path);
    updates.logo_url = publicUrl;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from("organizations")
    .update(updates as any)
    .eq("id", org.id);
  if (error) return { error: "No se pudo actualizar la configuración." };

  revalidatePath(`/${orgSlug}/dashboard`, "layout");
  return { ok: true };
}
