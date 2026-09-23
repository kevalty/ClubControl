"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

export async function enrollMember(
  orgSlug: string,
  orgId: string,
  classId: string,
  memberId: string
): Promise<{ error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const { error } = await supabase.from("class_enrollments").insert({
    organization_id: orgId,
    class_id: classId,
    member_id: memberId,
    status: "active",
  });
  if (error && error.code !== "23505") {
    return { error: "No se pudo inscribir al miembro." };
  }
  revalidatePath(`/${orgSlug}/dashboard/clases/${classId}`);
  return {};
}

export async function unenrollMember(
  orgSlug: string,
  orgId: string,
  classId: string,
  memberId: string
): Promise<{ error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;
  const { error } = await supabase
    .from("class_enrollments")
    .delete()
    .eq("class_id", classId)
    .eq("member_id", memberId);
  if (error) return { error: "No se pudo remover al miembro." };
  revalidatePath(`/${orgSlug}/dashboard/clases/${classId}`);
  return {};
}
