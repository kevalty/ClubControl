"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registroSchema } from "@/lib/validations/registro";
import { slugify } from "@/lib/slug";

const TRIAL_DAYS = 14;
const MAX_SLUG_ATTEMPTS = 5;

export async function registrarClub(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = registroSchema.safeParse({
    nombreClub: formData.get("nombreClub"),
    nombreDueno: formData.get("nombreDueno"),
    email: formData.get("email"),
    telefono: formData.get("telefono"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { nombreClub, nombreDueno, email, telefono, password } = parsed.data;
  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: nombreDueno } },
  });

  if (signUpError || !signUpData.user) {
    if (signUpError?.code === "user_already_exists" || signUpError?.code === "email_exists") {
      return { error: "Ya existe una cuenta con ese correo. Inicia sesión en vez de registrarte." };
    }
    if (signUpError?.message?.toLowerCase().includes("rate limit") || signUpError?.status === 429) {
      return { error: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo." };
    }
    console.error("[registro] signUp error:", signUpError);
    return { error: `No se pudo crear la cuenta: ${signUpError?.message ?? "error desconocido"}` };
  }

  const userId = signUpData.user.id;
  const baseSlug = slugify(nombreClub) || "club";
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  let orgId: string | null = null;
  let finalSlug = baseSlug;

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const candidateSlug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    // No se puede encadenar .select() aquí: la política RLS de SELECT sobre
    // `organizations` solo deja ver clubes de los que el usuario ya es
    // miembro, y ese vínculo (organization_members) todavía no existe en
    // este punto — Postgres reportaría el fallo de visibilidad de
    // RETURNING como si el INSERT mismo violara RLS. Generamos el id acá
    // mismo para no necesitar leerlo de vuelta.
    const candidateId = crypto.randomUUID();
    const { error: orgError } = await supabase.from("organizations").insert({
      id: candidateId,
      slug: candidateSlug,
      name: nombreClub,
      phone: telefono,
      email,
      status: "trial",
      trial_ends_at: trialEndsAt,
    });

    if (!orgError) {
      orgId = candidateId;
      finalSlug = candidateSlug;
      break;
    }

    // 23505 = unique_violation (slug duplicado). Reintenta con otro slug.
    if (orgError.code !== "23505") {
      return { error: "No se pudo crear el club. Intenta de nuevo." };
    }
  }

  if (!orgId) {
    return { error: "No se pudo generar un identificador único para el club. Intenta con otro nombre." };
  }

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: orgId,
    user_id: userId,
    role: "owner",
    status: "active",
  });

  if (memberError) {
    return { error: "El club se creó pero no se pudo asignar tu rol de dueño. Contacta soporte." };
  }

  const { data: trialPlan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("key", "trial")
    .single();

  if (trialPlan) {
    await supabase.from("organization_subscriptions").insert({
      organization_id: orgId,
      plan_id: trialPlan.id,
      status: "trialing",
      current_period_end: trialEndsAt,
    });
  }

  await supabase.from("audit_logs").insert({
    organization_id: orgId,
    actor_user_id: userId,
    action: "organization.created",
    entity_type: "organization",
    entity_id: orgId,
  });

  redirect(`/${finalSlug}/onboarding`);
}
