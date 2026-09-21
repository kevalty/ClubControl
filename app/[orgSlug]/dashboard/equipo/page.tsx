import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { invitarMiembroEquipo } from "./actions";
import { InvitarForm } from "./invitar-form";

const ROLE_LABELS: Record<string, string> = {
  owner: "Dueño",
  admin: "Administrador",
  staff: "Recepción / Staff",
  trainer: "Entrenador",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  invited: "Invitado (pendiente)",
  suspended: "Suspendido",
};

export default async function EquipoPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) notFound();

  const { data: authUser } = await supabase.auth.getUser();

  const { data: myMembership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", authUser.user?.id ?? "")
    .maybeSingle();

  const canManage = myMembership?.role === "owner" || myMembership?.role === "admin";

  // Traer miembros del equipo con su perfil de usuario
  const { data: equipo } = await supabase
    .from("organization_members")
    .select("id, user_id, role, status, invited_email, created_at")
    .eq("organization_id", org.id)
    .order("created_at");

  // Obtener emails de los usuarios activos
  const userIds = (equipo ?? [])
    .filter((m) => m.status !== "invited")
    .map((m) => m.user_id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (supabase as any)
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"])
    .catch(() => ({ data: [] }));

  const profileMap = new Map(
    ((profiles as Array<{ id: string; full_name: string | null; email: string | null }>) ?? []).map(
      (p) => [p.id, p]
    )
  );

  const action = invitarMiembroEquipo.bind(null, orgSlug, org.id);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Equipo</h1>

      {/* Lista de integrantes */}
      <div className="space-y-3">
        {!equipo?.length ? (
          <p className="text-muted-foreground">No hay integrantes registrados.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {equipo.map((m) => {
              const profile = profileMap.get(m.user_id);
              const displayName =
                m.status === "invited"
                  ? m.invited_email ?? "Sin correo"
                  : profile?.full_name ?? profile?.email ?? m.user_id;

              return (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-4"
                >
                  <div>
                    <p className="font-medium">{displayName}</p>
                    {profile?.email && m.status !== "invited" ? (
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {ROLE_LABELS[m.role] ?? m.role}
                    </Badge>
                    <Badge
                      variant={
                        m.status === "active"
                          ? "default"
                          : m.status === "invited"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {STATUS_LABELS[m.status] ?? m.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Formulario de invitación */}
      {canManage ? (
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="font-semibold">Agregar integrante</h2>
          <p className="text-sm text-muted-foreground">
            Ingresa el correo de la persona. Si ya tiene cuenta en la plataforma se la agregará
            directamente; si no, podrá unirse cuando cree su cuenta con ese mismo correo.
          </p>
          <InvitarForm action={action} />
        </div>
      ) : null}
    </div>
  );
}
