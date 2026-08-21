import { createClient } from "@/lib/supabase/server";
import { getOrgMembersWithNames } from "@/lib/organization-members";
import { crearClase } from "@/app/[orgSlug]/dashboard/clases/actions";
import { ClaseForm } from "@/app/[orgSlug]/dashboard/clases/clase-form";

export default async function NuevaClasePage({
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
    .single();

  const entrenadores = await getOrgMembersWithNames(org!.id, ["trainer", "owner", "admin"]);
  const action = crearClase.bind(null, orgSlug, org!.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nueva clase</h1>
      <p className="text-sm text-muted-foreground">
        Se generarán automáticamente las sesiones de las próximas 8 semanas
        según los días y horario que elijas.
      </p>
      <ClaseForm action={action} entrenadores={entrenadores} submitLabel="Crear clase" />
    </div>
  );
}
