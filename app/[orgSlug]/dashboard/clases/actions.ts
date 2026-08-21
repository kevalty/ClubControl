"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { classSchema } from "@/lib/validations/class";
import { generateSessionDates } from "@/lib/classes/generate-sessions";

const WEEKS_AHEAD = 8;

function parseClassForm(formData: FormData) {
  return classSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    trainerUserId: formData.get("trainerUserId") || undefined,
    capacity: formData.get("capacity"),
    location: formData.get("location") || undefined,
    days: formData.getAll("days"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });
}

export async function crearClase(
  orgSlug: string,
  orgId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const parsed = parseClassForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { data: clase, error } = await supabase
    .from("classes")
    .insert({
      organization_id: orgId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      trainer_user_id: parsed.data.trainerUserId || null,
      capacity: parsed.data.capacity,
      location: parsed.data.location || null,
      recurrence_rule: {
        days: parsed.data.days,
        start_time: parsed.data.startTime,
        end_time: parsed.data.endTime,
      },
    })
    .select("id")
    .single();

  if (error) {
    return { error: "No se pudo crear la clase." };
  }

  await generarSesiones(supabase, orgId, clase.id, parsed.data.days, parsed.data.startTime, parsed.data.endTime);

  revalidatePath(`/${orgSlug}/dashboard/clases`);
  redirect(`/${orgSlug}/dashboard/clases`);
}

async function generarSesiones(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  classId: string,
  days: string[],
  startTime: string,
  endTime: string
) {
  const fechas = generateSessionDates(days, WEEKS_AHEAD);
  if (fechas.length === 0) return;

  await supabase.from("class_sessions").insert(
    fechas.map((session_date) => ({
      class_id: classId,
      organization_id: orgId,
      session_date,
      start_time: startTime,
      end_time: endTime,
    }))
  );
}

export async function actualizarClase(
  orgSlug: string,
  classId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const parsed = parseClassForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      trainer_user_id: parsed.data.trainerUserId || null,
      capacity: parsed.data.capacity,
      location: parsed.data.location || null,
      recurrence_rule: {
        days: parsed.data.days,
        start_time: parsed.data.startTime,
        end_time: parsed.data.endTime,
      },
    })
    .eq("id", classId);

  if (error) {
    return { error: "No se pudo actualizar la clase." };
  }

  // No se regeneran las sesiones futuras automáticamente al editar (podría
  // duplicar sesiones ya reservadas por miembros). TODO: confirmar con
  // cliente si un cambio de horario debe regenerar las sesiones futuras
  // sin reservas todavía.
  revalidatePath(`/${orgSlug}/dashboard/clases`);
  redirect(`/${orgSlug}/dashboard/clases`);
}

export async function alternarActivaClase(orgSlug: string, classId: string, activar: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .update({ is_active: activar })
    .eq("id", classId);

  if (error) {
    return { error: "No se pudo actualizar el estado de la clase." };
  }

  revalidatePath(`/${orgSlug}/dashboard/clases`);
  return { ok: true };
}
