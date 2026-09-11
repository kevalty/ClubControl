import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";

export default async function RubrosPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", orgSlug).maybeSingle();
  if (!org) notFound();

  const { data: rubros } = await supabase
    .from("fee_types")
    .select("id, name, description, discount_percent, is_active")
    .eq("organization_id", org.id)
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rubros / Tipos de tarifa</h1>
        <LinkButton href={`/${orgSlug}/dashboard/configuracion/rubros/nuevo`}>
          Nuevo rubro
        </LinkButton>
      </div>
      {!rubros?.length ? (
        <p className="text-muted-foreground">No hay rubros creados. Crea el primero para asignar tarifas especiales a tus estudiantes.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {rubros.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{r.name}</p>
                {r.description ? <p className="text-sm text-muted-foreground">{r.description}</p> : null}
                <p className="text-sm text-muted-foreground">Descuento: {r.discount_percent}%</p>
              </div>
              <LinkButton
                href={`/${orgSlug}/dashboard/configuracion/rubros/${r.id}/editar`}
                variant="outline"
                size="sm"
              >
                Editar
              </LinkButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
