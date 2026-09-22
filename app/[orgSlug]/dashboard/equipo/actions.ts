"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const teamSchema = z.object({
  name: z.string().min(2, "El nombre del equipo es requerido."),
  sport: z.string().optional(),
  category: z.string().optional(),
  tournament_name: z.string().optional(),
  tournament_date: z.string().optional(),
  notes: z.string().optional(),
});

export async function crearEquipo(
  orgSlug: string,
  orgId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const parsed = teamSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("teams").insert({
    organization_id: orgId,
    ...parsed.data,
    tournament_date: parsed.data.tournament_date || null,
  });
  if (error) return { error: "No se pudo crear el equipo." };

  revalidatePath(`/${orgSlug}/dashboard/equipo`);
  return { ok: true };
}

export async function agregarMiembroEquipoTorneo(
  orgSlug: string,
  teamId: string,
  memberId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("team_members")
    .insert({ team_id: teamId, member_id: memberId });
  if (error && error.code !== "23505") return { error: "No se pudo agregar el miembro." };
  revalidatePath(`/${orgSlug}/dashboard/equipo/${teamId}`);
  return {};
}

export async function quitarMiembroEquipoTorneo(
  orgSlug: string,
  teamId: string,
  memberId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("member_id", memberId);
  if (error) return { error: "No se pudo remover el miembro del equipo." };
  revalidatePath(`/${orgSlug}/dashboard/equipo/${teamId}`);
  return {};
}
