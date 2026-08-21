"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function alternarSuspensionClub(orgId: string, suspender: boolean) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("organizations")
    .update({ status: suspender ? "suspended" : "active" })
    .eq("id", orgId);

  if (error) {
    return { error: "No se pudo actualizar el club." };
  }

  await supabase.from("audit_logs").insert({
    organization_id: orgId,
    actor_user_id: userData.user?.id,
    action: suspender ? "organization.suspended" : "organization.reactivated",
    entity_type: "organization",
    entity_id: orgId,
  });

  revalidatePath("/admin/clubes");
  return { ok: true };
}
