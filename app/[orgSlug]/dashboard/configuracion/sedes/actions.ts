"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const SedeSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function crearSede(
  orgSlug: string,
  orgId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = SedeSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("locations").insert({
    organization_id: orgId,
    ...parsed.data,
  });
  if (error) return { error: error.message };

  redirect(`/${orgSlug}/dashboard/configuracion/sedes`);
}

export async function editarSede(
  orgSlug: string,
  orgId: string,
  sedeId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = SedeSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("locations")
    .update(parsed.data)
    .eq("id", sedeId)
    .eq("organization_id", orgId);
  if (error) return { error: error.message };

  redirect(`/${orgSlug}/dashboard/configuracion/sedes`);
}

export async function toggleSede(sedeId: string, isActive: boolean) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("locations").update({ is_active: isActive }).eq("id", sedeId);
}
