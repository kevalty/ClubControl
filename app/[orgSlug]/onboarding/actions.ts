"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { membershipPlanSchema } from "@/lib/validations/membership-plan";

export async function guardarPerfilClub(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const orgId = String(formData.get("orgId") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const primaryColor = String(formData.get("primaryColor") ?? "#0EA5E9").trim();
  const logoFile = formData.get("logo") as File | null;

  const updates: Record<string, unknown> = {
    address: address || null,
    primary_color: primaryColor,
  };

  if (logoFile && logoFile.size > 0) {
    const serviceClient = createServiceClient() as unknown as ReturnType<typeof createServiceClient>;
    const ext = logoFile.name.split(".").pop() ?? "png";
    const path = `${orgId}/logo.${ext}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: uploadError } = await (serviceClient as any).storage
      .from("org-logos")
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type });
    if (!uploadError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { publicUrl } } = (serviceClient as any).storage
        .from("org-logos")
        .getPublicUrl(path);
      updates.logo_url = publicUrl;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", orgId);

  if (error) {
    return { error: "No se pudieron guardar los datos del club." };
  }

  return { ok: true };
}

export async function subirLogoClub(orgId: string, file: File) {
  const supabase = await createClient();
  const path = `${orgId}/logo-${Date.now()}.${file.name.split(".").pop()}`;

  const { error: uploadError } = await supabase.storage
    .from("org-logos")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return { error: "No se pudo subir el logo." };
  }

  const { error: updateError } = await supabase
    .from("organizations")
    .update({ logo_url: path })
    .eq("id", orgId);

  if (updateError) {
    return { error: "El logo se subió pero no se pudo guardar en el club." };
  }

  return { ok: true };
}

export async function crearPrimerPlan(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const orgId = String(formData.get("orgId") ?? "");
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

  return { ok: true };
}

export async function invitarPrimerStaff(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const orgId = String(formData.get("orgId") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "staff");

  if (!email) {
    return { error: "Ingresa un correo válido." };
  }

  // organization_members.user_id es NOT NULL, así que no podemos crear la
  // fila hasta que exista una fila real en auth.users. Se usa la Admin API
  // (requiere service_role) para crear/invitar al usuario de una vez —
  // Supabase envía el correo de invitación con un link para fijar contraseña.
  // TODO(módulo 8.9, sin fase numerada explícita en CLAUDE.md — ver
  // PROGRESS.md): página de aceptación de invitación que, al primer login,
  // pase organization_members.status de 'invited' a 'active'. Por ahora el
  // owner/admin deberá activarla manualmente desde /equipo cuando exista ese módulo.
  const serviceClient = createServiceClient();
  const { data: invited, error: inviteError } =
    await serviceClient.auth.admin.inviteUserByEmail(email);

  if (inviteError || !invited.user) {
    return { error: "No se pudo enviar la invitación. Verifica el correo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("organization_members").insert({
    organization_id: orgId,
    user_id: invited.user.id,
    role,
    status: "invited",
    invited_email: email,
  });

  if (error) {
    return { error: "La invitación se envió pero no se pudo vincular al club." };
  }

  return { ok: true };
}
