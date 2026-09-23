"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  discount_amount: z.coerce.number().min(0).optional().nullable(),
  discount_percent: z.coerce.number().min(0).max(100).optional().nullable(),
});

export async function crearGrupoFamiliar(
  orgSlug: string, orgId: string, _prev: unknown, formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const raw = Object.fromEntries(formData.entries());
  // Treat empty strings as null for optional numeric fields
  if (raw.discount_amount === "") raw.discount_amount = undefined as unknown as FormDataEntryValue;
  if (raw.discount_percent === "") raw.discount_percent = undefined as unknown as FormDataEntryValue;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("family_groups").insert({
    organization_id: orgId,
    name: parsed.data.name,
    discount_amount: parsed.data.discount_amount ?? null,
    discount_percent: parsed.data.discount_percent ?? null,
  });
  if (error) return { error: "No se pudo crear el grupo." };
  revalidatePath(`/${orgSlug}/dashboard/configuracion/familias`);
  return { ok: true };
}

export async function agregarMiembroFamiliar(
  orgSlug: string, familiaId: string, memberId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("family_group_members")
    .insert({ family_group_id: familiaId, member_id: memberId });
  if (error && error.code !== "23505") return { error: "No se pudo agregar el miembro." };
  revalidatePath(`/${orgSlug}/dashboard/configuracion/familias/${familiaId}`);
  return {};
}

export async function quitarMiembroFamiliar(
  orgSlug: string, familiaId: string, memberId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("family_group_members")
    .delete().eq("family_group_id", familiaId).eq("member_id", memberId);
  if (error) return { error: "No se pudo remover el miembro." };
  revalidatePath(`/${orgSlug}/dashboard/configuracion/familias/${familiaId}`);
  return {};
}
