import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";
import { AprobarRechazarButtons } from "./aprobar-rechazar-buttons";

export default async function InscripcionesPage({
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

  const [
    { data: pendingMembers },
    { data: feeTypes },
    { data: locations },
    { data: clases },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("members")
      .select(
        "id, full_name, birth_date, school, grade, created_at, registration_status"
      )
      .eq("organization_id", org.id)
      .eq("registration_status", "pending_approval")
      .order("created_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("fee_types")
      .select("id, name")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("name"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("locations")
      .select("id, name")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("classes")
      .select("id, name")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">
          Solicitudes de inscripción
          {pendingMembers?.length ? (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({pendingMembers.length} pendiente{pendingMembers.length !== 1 ? "s" : ""})
            </span>
          ) : null}
        </h1>
        <LinkButton
          href={`/${orgSlug}/inscripcion`}
          variant="outline"
          size="sm"
          target="_blank"
        >
          Ver formulario público
        </LinkButton>
      </div>

      {!pendingMembers?.length ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No hay solicitudes pendientes de revisión.
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {pendingMembers.map((m: any) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div>
                <p className="font-medium">{m.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {[m.school, m.grade].filter(Boolean).join(" · ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Enviado:{" "}
                  {new Date(m.created_at).toLocaleDateString("es-EC", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <LinkButton
                  href={`/${orgSlug}/dashboard/miembros/${m.id}`}
                  variant="outline"
                  size="sm"
                >
                  Ver ficha
                </LinkButton>
                <AprobarRechazarButtons
                  orgSlug={orgSlug}
                  memberId={m.id}
                  feeTypes={feeTypes ?? []}
                  locations={locations ?? []}
                  clases={clases ?? []}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
