"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { subscriptionPlanSchema } from "@/lib/validations/subscription-plan";

export async function crearPlanPlataforma(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const parsed = subscriptionPlanSchema.safeParse({
    key: formData.get("key"),
    name: formData.get("name"),
    priceMonthly: formData.get("priceMonthly"),
    maxMembers: formData.get("maxMembers") || undefined,
    maxStaff: formData.get("maxStaff") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subscription_plans").insert({
    key: parsed.data.key,
    name: parsed.data.name,
    price_monthly: parsed.data.priceMonthly,
    max_members: parsed.data.maxMembers || null,
    max_staff: parsed.data.maxStaff || null,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "Ya existe un plan con esa clave." : "No se pudo crear el plan.",
    };
  }

  revalidatePath("/admin/planes");
  return { ok: true };
}

export async function alternarActivoPlanPlataforma(planId: string, activar: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("subscription_plans")
    .update({ is_active: activar })
    .eq("id", planId);

  if (error) {
    return { error: "No se pudo actualizar el plan." };
  }

  revalidatePath("/admin/planes");
  return { ok: true };
}
