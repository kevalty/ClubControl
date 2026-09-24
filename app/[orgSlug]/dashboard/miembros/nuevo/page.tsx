import { createClient } from "@/lib/supabase/server";
import { crearMiembro } from "@/app/[orgSlug]/dashboard/miembros/actions";
import { MiembroForm } from "@/app/[orgSlug]/dashboard/miembros/miembro-form";

export default async function NuevoMiembroPage({
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

  const [{ data: locations }, { data: feeTypes }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("locations")
      .select("id, name")
      .eq("organization_id", org!.id)
      .eq("is_active", true)
      .order("name"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("fee_types")
      .select("id, name, discount_percent")
      .eq("organization_id", org!.id)
      .eq("is_active", true)
      .order("name"),
  ]);

  const action = crearMiembro.bind(null, orgSlug, org!.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo miembro</h1>
      <MiembroForm
        action={action}
        submitLabel="Crear miembro"
        locations={locations ?? []}
        feeTypes={feeTypes ?? []}
      />
    </div>
  );
}
