"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { memberSchema } from "@/lib/validations/member";

function parseMemberForm(formData: FormData) {
  return memberSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone"),
    documentId: formData.get("documentId") || undefined,
    birthDate: formData.get("birthDate") || undefined,
    emergencyContactName: formData.get("emergencyContactName") || undefined,
    emergencyContactPhone: formData.get("emergencyContactPhone") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function crearMiembro(
  orgSlug: string,
  orgId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const parsed = parseMemberForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("members").insert({
    organization_id: orgId,
    full_name: parsed.data.fullName,
    email: parsed.data.email || null,
    phone: parsed.data.phone,
    document_id: parsed.data.documentId || null,
    birth_date: parsed.data.birthDate || null,
    emergency_contact_name: parsed.data.emergencyContactName || null,
    emergency_contact_phone: parsed.data.emergencyContactPhone || null,
    notes: parsed.data.notes || null,
  });

  if (error) {
    return { error: "No se pudo crear el miembro. Intenta de nuevo." };
  }

  revalidatePath(`/${orgSlug}/dashboard/miembros`);
  redirect(`/${orgSlug}/dashboard/miembros`);
}

export async function actualizarMiembro(
  orgSlug: string,
  memberId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const parsed = parseMemberForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({
      full_name: parsed.data.fullName,
      email: parsed.data.email || null,
      phone: parsed.data.phone,
      document_id: parsed.data.documentId || null,
      birth_date: parsed.data.birthDate || null,
      emergency_contact_name: parsed.data.emergencyContactName || null,
      emergency_contact_phone: parsed.data.emergencyContactPhone || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", memberId);

  if (error) {
    return { error: "No se pudo actualizar el miembro." };
  }

  revalidatePath(`/${orgSlug}/dashboard/miembros`);
  redirect(`/${orgSlug}/dashboard/miembros/${memberId}`);
}

// "Congelar" pausa el acceso del miembro (no puede hacer check-in, ver
// regla CLAUDE.md §6.5) y congela sus membresías activas. No recorre
// end_date automáticamente — TODO: confirmar con cliente si al reactivar
// se debe extender end_date por los días congelados, o si el club prefiere
// ajustarlo manualmente caso por caso.
export async function congelarMiembro(orgSlug: string, memberId: string) {
  const supabase = await createClient();

  const { error: membershipsError } = await supabase
    .from("memberships")
    .update({ status: "frozen" })
    .eq("member_id", memberId)
    .eq("status", "active");

  const { error: memberError } = await supabase
    .from("members")
    .update({ status: "frozen" })
    .eq("id", memberId);

  if (membershipsError || memberError) {
    return { error: "No se pudo congelar la membresía." };
  }

  revalidatePath(`/${orgSlug}/dashboard/miembros/${memberId}`);
  revalidatePath(`/${orgSlug}/dashboard/miembros`);
  return { ok: true };
}

export async function reactivarMiembro(orgSlug: string, memberId: string) {
  const supabase = await createClient();

  const { error: membershipsError } = await supabase
    .from("memberships")
    .update({ status: "active" })
    .eq("member_id", memberId)
    .eq("status", "frozen");

  const { error: memberError } = await supabase
    .from("members")
    .update({ status: "active" })
    .eq("id", memberId);

  if (membershipsError || memberError) {
    return { error: "No se pudo reactivar la membresía." };
  }

  revalidatePath(`/${orgSlug}/dashboard/miembros/${memberId}`);
  revalidatePath(`/${orgSlug}/dashboard/miembros`);
  return { ok: true };
}

// Genera (o reenvía) el acceso del miembro a su portal de self-service.
// Igual que la invitación de staff (8.1): organization_members no aplica
// acá, pero members.user_id también es una FK que necesita un auth.users
// real, así que se usa la Admin API para crear/reinvitar de una sola vez.
export async function generarAccesoPortal(orgSlug: string, memberId: string) {
  const supabase = await createClient();
  const { data: member } = await supabase
    .from("members")
    .select("id, email, user_id, organization_id")
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    return { error: "Miembro no encontrado." };
  }
  if (!member.email) {
    return { error: "El miembro no tiene un correo registrado." };
  }

  const serviceClient = createServiceClient();

  if (!member.user_id) {
    const { data: invited, error: inviteError } =
      await serviceClient.auth.admin.inviteUserByEmail(member.email);

    if (inviteError || !invited.user) {
      return { error: "No se pudo enviar la invitación al portal." };
    }

    const { error: linkError } = await supabase
      .from("members")
      .update({ user_id: invited.user.id })
      .eq("id", memberId);

    if (linkError) {
      return { error: "La invitación se envió pero no se pudo vincular al miembro." };
    }
  } else {
    // Ya tiene cuenta: se reenvía el correo de recuperación de contraseña
    // como forma de "reenviar acceso" (no hay un reenvío nativo de invite
    // una vez que el usuario ya existe en auth.users).
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      member.email
    );
    if (resetError) {
      return { error: "No se pudo reenviar el acceso." };
    }
  }

  const { data: authData } = await supabase.auth.getUser();
  await supabase.from("audit_logs").insert({
    organization_id: member.organization_id,
    actor_user_id: authData.user?.id,
    action: "member.portal_access_granted",
    entity_type: "member",
    entity_id: memberId,
  });

  revalidatePath(`/${orgSlug}/dashboard/miembros/${memberId}`);
  return { ok: true };
}

export async function eliminarMiembro(orgSlug: string, memberId: string) {
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("members")
    .select("organization_id, full_name")
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    return { error: "Miembro no encontrado." };
  }

  // Se registra en audit_logs ANTES de borrar (CLAUDE.md §11.3: eliminar un
  // miembro es una acción sensible) porque entity_id ya no sería resoluble
  // después del delete en cascada.
  const { data: authData } = await supabase.auth.getUser();
  await supabase.from("audit_logs").insert({
    organization_id: member.organization_id,
    actor_user_id: authData.user?.id,
    action: "member.deleted",
    entity_type: "member",
    entity_id: memberId,
    metadata: { full_name: member.full_name },
  });

  const { error } = await supabase.from("members").delete().eq("id", memberId);

  if (error) {
    return { error: "No se pudo eliminar el miembro." };
  }

  revalidatePath(`/${orgSlug}/dashboard/miembros`);
  redirect(`/${orgSlug}/dashboard/miembros`);
}
