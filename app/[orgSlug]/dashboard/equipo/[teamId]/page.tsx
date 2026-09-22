import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";
import { TeamMemberManager } from "./team-member-manager";
import {
  agregarMiembroEquipoTorneo,
  quitarMiembroEquipoTorneo,
} from "../actions";

export default async function EquipoDetallePage({
  params,
}: {
  params: Promise<{ orgSlug: string; teamId: string }>;
}) {
  const { orgSlug, teamId } = await params;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: team } = await (supabase as any)
    .from("teams")
    .select(
      "id, name, sport, category, tournament_name, tournament_date, notes, organization_id"
    )
    .eq("id", teamId)
    .maybeSingle();
  if (!team) notFound();

  const [{ data: teamMembers }, { data: allMembers }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("team_members")
      .select("member_id, members(id, full_name)")
      .eq("team_id", teamId),
    supabase
      .from("members")
      .select("id, full_name")
      .eq("organization_id", team.organization_id as string)
      .eq("status", "active")
      .order("full_name"),
  ]);

  const memberIdsInTeam = new Set(
    (
      (teamMembers ?? []) as Array<{ member_id: string }>
    ).map((tm) => tm.member_id)
  );
  const availableMembers = (allMembers ?? []).filter(
    (m) => !memberIdsInTeam.has(m.id)
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <LinkButton
          href={`/${orgSlug}/dashboard/equipo`}
          variant="ghost"
          size="sm"
          className="mb-2"
        >
          ← Volver a equipos
        </LinkButton>
        <h1 className="text-2xl font-semibold">{team.name as string}</h1>
        <p className="text-sm text-muted-foreground">
          {[team.sport, team.category].filter(Boolean).join(" · ")}
        </p>
        {team.tournament_name ? (
          <p className="text-sm text-muted-foreground">
            Torneo: {team.tournament_name as string}
            {team.tournament_date
              ? ` — ${new Date(
                  team.tournament_date as string
                ).toLocaleDateString("es-EC")}`
              : ""}
          </p>
        ) : null}
        {team.notes ? (
          <p className="mt-2 text-sm">{team.notes as string}</p>
        ) : null}
      </div>

      <TeamMemberManager
        orgSlug={orgSlug}
        teamId={teamId}
        teamMembers={(
          (teamMembers ?? []) as Array<{
            member_id: string;
            members: { id: string; full_name: string } | null;
          }>
        ).map((tm) => ({
          member_id: tm.member_id,
          full_name: tm.members?.full_name ?? "—",
        }))}
        availableMembers={(availableMembers ?? []) as { id: string; full_name: string }[]}
        agregarAction={agregarMiembroEquipoTorneo.bind(null, orgSlug, teamId)}
        quitarAction={quitarMiembroEquipoTorneo.bind(null, orgSlug, teamId)}
      />
    </div>
  );
}
