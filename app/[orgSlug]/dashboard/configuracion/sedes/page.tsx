import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";

export default async function SedesPage({
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

  const { data: sedes } = await supabase
    .from("locations")
    .select("id, name, address, phone, is_active")
    .eq("organization_id", org.id)
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sedes</h1>
        <LinkButton href={`/${orgSlug}/dashboard/configuracion/sedes/nueva`}>
          Nueva sede
        </LinkButton>
      </div>
      {!sedes?.length ? (
        <p className="text-muted-foreground">No hay sedes registradas. Crea la primera.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {sedes.map((sede) => (
            <div key={sede.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{sede.name}</p>
                {sede.address ? <p className="text-sm text-muted-foreground">{sede.address}</p> : null}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={sede.is_active ? "default" : "secondary"}>
                  {sede.is_active ? "Activa" : "Inactiva"}
                </Badge>
                <LinkButton
                  href={`/${orgSlug}/dashboard/configuracion/sedes/${sede.id}/editar`}
                  variant="outline"
                  size="sm"
                >
                  Editar
                </LinkButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
