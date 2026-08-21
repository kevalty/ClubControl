import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// auth.users no se expone vía PostgREST (privacidad), así que no hay forma
// de leer el nombre de un miembro del equipo con el cliente normal, ni
// siquiera con RLS a favor. Server-only: junta organization_members (RLS
// normal) con la Admin API (service_role) para resolver nombre/email.
// "server-only" evita que este módulo se pueda importar por error desde un
// client component (filtraría el uso de la Admin API al bundle del navegador).
export async function getOrgMembersWithNames(
  orgId: string,
  roles?: string[]
) {
  const supabase = await createClient();
  let query = supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", orgId)
    .eq("status", "active");

  if (roles && roles.length > 0) {
    query = query.in("role", roles);
  }

  const { data: members } = await query;
  if (!members || members.length === 0) return [];

  const serviceClient = createServiceClient();
  const results = await Promise.all(
    members.map(async (m) => {
      const { data } = await serviceClient.auth.admin.getUserById(m.user_id);
      const name =
        (data.user?.user_metadata?.full_name as string | undefined) ??
        data.user?.email ??
        "Usuario";
      return { userId: m.user_id, role: m.role, name, email: data.user?.email ?? null };
    })
  );

  return results;
}
