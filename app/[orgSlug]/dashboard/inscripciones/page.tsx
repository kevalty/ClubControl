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

  const { data: pending } = await supabase
    .from("members")
    .select(
      "id, full_name, birth_date, school, grade, created_at, registration_status"
    )
    .eq("organization_id", org.id)
    .eq("registration_status", "pending_approval")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">
          Solicitudes de inscripción
          {pending?.length ? (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({pending.length} pendiente{pending.length !== 1 ? "s" : ""})
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

      {!pending?.length ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No hay solicitudes pendientes de revisión.
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {pending.map((m) => (
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
                <AprobarRechazarButtons orgSlug={orgSlug} memberId={m.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
