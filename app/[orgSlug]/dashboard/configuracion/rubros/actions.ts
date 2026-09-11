"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const RubroSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  discount_percent: z.coerce.number().min(0).max(100),
});

export async function crearRubro(
  orgSlug: string,
  orgId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = RubroSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    discount_percent: formData.get("discount_percent") ?? 0,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("fee_types").insert({
    organization_id: orgId,
    ...parsed.data,
  });
  if (error) return { error: error.message };

  redirect(`/${orgSlug}/dashboard/configuracion/rubros`);
}

export async function editarRubro(
  orgSlug: string,
  orgId: string,
  rubroId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = RubroSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    discount_percent: formData.get("discount_percent") ?? 0,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("fee_types")
    .update(parsed.data)
    .eq("id", rubroId)
    .eq("organization_id", orgId);
  if (error) return { error: error.message };

  redirect(`/${orgSlug}/dashboard/configuracion/rubros`);
}
