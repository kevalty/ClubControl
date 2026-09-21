"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const invitarSchema = z.object({
  email: z.string().email("Correo inválido"),
  role: z.enum(["admin", "staff", "trainer"], {
    errorMap: () => ({ message: "Rol inválido" }),
  }),
});

export async function invitarMiembroEquipo(
  orgSlug: string,
  orgId: string,
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = invitarSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { email, role } = parsed.data;
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return { error: "No autenticado." };

  // Verificar que el que invita sea owner o admin
  const { data: myRole } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", authUser.user.id)
    .maybeSingle();

  if (!myRole || !["owner", "admin"].includes(myRole.role)) {
    return { error: "No tienes permiso para invitar miembros." };
  }

  // Buscar si ya existe un usuario con ese email
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingUser } = await (supabase as any).rpc("get_user_id_by_email", {
    p_email: email,
  });

  if (existingUser) {
    // El usuario ya tiene cuenta — agregar directamente
    const { error } = await supabase.from("organization_members").upsert(
      {
        organization_id: orgId,
        user_id: existingUser,
        role,
        status: "active",
      },
      { onConflict: "organization_id,user_id" }
    );
    if (error) return { error: "No se pudo agregar al equipo." };
  } else {
    // No tiene cuenta aún — guardar invitación pendiente por email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("organization_members").insert({
      organization_id: orgId,
      user_id: authUser.user.id, // placeholder — se actualiza cuando el usuario crea su cuenta
      role,
      status: "invited",
      invited_email: email,
    });
    if (error) {
      // Si hay conflicto (ya fue invitado), ignorar
      if (error.code !== "23505") return { error: "No se pudo registrar la invitación." };
    }
  }

  revalidatePath(`/${orgSlug}/dashboard/equipo`);
  return { ok: true };
}

export async function cambiarRolMiembro(
  orgSlug: string,
  orgId: string,
  targetUserId: string,
  newRole: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return { error: "No autenticado." };

  const { data: myRole } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", authUser.user.id)
    .maybeSingle();

  if (myRole?.role !== "owner") {
    return { error: "Solo el dueño puede cambiar roles." };
  }
  if (targetUserId === authUser.user.id) {
    return { error: "No puedes cambiar tu propio rol." };
  }

  await supabase
    .from("organization_members")
    .update({ role: newRole })
    .eq("organization_id", orgId)
    .eq("user_id", targetUserId);

  revalidatePath(`/${orgSlug}/dashboard/equipo`);
  return {};
}

export async function revocarAcceso(
  orgSlug: string,
  orgId: string,
  targetUserId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return { error: "No autenticado." };

  const { data: myRole } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", authUser.user.id)
    .maybeSingle();

  if (!myRole || !["owner", "admin"].includes(myRole.role)) {
    return { error: "No tienes permiso para revocar accesos." };
  }
  if (targetUserId === authUser.user.id) {
    return { error: "No puedes revocar tu propio acceso." };
  }

  await supabase
    .from("organization_members")
    .update({ status: "suspended" })
    .eq("organization_id", orgId)
    .eq("user_id", targetUserId);

  revalidatePath(`/${orgSlug}/dashboard/equipo`);
  return {};
}
