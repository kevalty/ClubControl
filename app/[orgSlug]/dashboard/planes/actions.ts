"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { membershipPlanSchema } from "@/lib/validations/membership-plan";

export async function crearPlan(
  orgSlug: string,
  orgId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const parsed = membershipPlanSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    billingCycle: formData.get("billingCycle"),
    sessionsIncluded: formData.get("sessionsIncluded") || undefined,
    durationDays: formData.get("durationDays"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("membership_plans").insert({
    organization_id: orgId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    price: parsed.data.price,
    billing_cycle: parsed.data.billingCycle,
    sessions_included: parsed.data.sessionsIncluded ?? null,
    duration_days: parsed.data.durationDays,
  });

  if (error) {
    return { error: "No se pudo crear el plan. Intenta de nuevo." };
  }

  revalidatePath(`/${orgSlug}/dashboard/planes`);
  redirect(`/${orgSlug}/dashboard/planes`);
}

export async function actualizarPlan(
  orgSlug: string,
  planId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const parsed = membershipPlanSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    billingCycle: formData.get("billingCycle"),
    sessionsIncluded: formData.get("sessionsIncluded") || undefined,
    durationDays: formData.get("durationDays"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("membership_plans")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      billing_cycle: parsed.data.billingCycle,
      sessions_included: parsed.data.sessionsIncluded ?? null,
      duration_days: parsed.data.durationDays,
    })
    .eq("id", planId);

  if (error) {
    return { error: "No se pudo actualizar el plan." };
  }

  revalidatePath(`/${orgSlug}/dashboard/planes`);
  redirect(`/${orgSlug}/dashboard/planes`);
}

// "Eliminar" un plan en realidad lo desactiva (is_active = false) en vez de
// borrarlo: memberships.plan_id referencia este plan y borrarlo rompería el
// histórico de membresías ya vendidas.
export async function alternarActivoPlan(
  orgSlug: string,
  planId: string,
  activar: boolean
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("membership_plans")
    .update({ is_active: activar })
    .eq("id", planId);

  if (error) {
    return { error: "No se pudo actualizar el estado del plan." };
  }

  revalidatePath(`/${orgSlug}/dashboard/planes`);
  return { ok: true };
}
