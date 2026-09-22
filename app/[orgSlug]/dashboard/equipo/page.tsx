import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";

export default async function EquiposTorneoPage({
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: teams } = await (supabase as any)
    .from("teams")
    .select("id, name, sport, category, tournament_name, tournament_date")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Equipos de torneo</h1>
          <p className="text-sm text-muted-foreground">
            Equipos para competencias y torneos
          </p>
        </div>
        <LinkButton href={`/${orgSlug}/dashboard/equipo/nuevo`}>
          Nuevo equipo
        </LinkButton>
      </div>

      {!teams?.length ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>No hay equipos creados.</p>
          <p className="mt-1 text-xs">
            Crea el primero para agregar deportistas y prepararte para el
            torneo.
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {(
            teams as Array<{
              id: string;
              name: string;
              sport: string | null;
              category: string | null;
              tournament_name: string | null;
              tournament_date: string | null;
            }>
          ).map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-4"
            >
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">
                  {[t.sport, t.category].filter(Boolean).join(" · ")}
                </p>
                {t.tournament_name ? (
                  <p className="text-xs text-muted-foreground">
                    {t.tournament_name}
                    {t.tournament_date
                      ? ` — ${new Date(t.tournament_date).toLocaleDateString(
                          "es-EC"
                        )}`
                      : ""}
                  </p>
                ) : null}
              </div>
              <LinkButton
                href={`/${orgSlug}/dashboard/equipo/${t.id}`}
                variant="outline"
                size="sm"
              >
                Ver equipo
              </LinkButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
