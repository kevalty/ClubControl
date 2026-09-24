import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { editarRubro } from "../../actions";
import { RubroForm } from "../../rubro-form";

export default async function EditarRubroPage({
  params,
}: {
  params: Promise<{ orgSlug: string; rubroId: string }>;
}) {
  const { orgSlug, rubroId } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", orgSlug).maybeSingle();
  if (!org) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rubro } = await (supabase as any)
    .from("fee_types")
    .select("name, description, discount_percent")
    .eq("id", rubroId)
    .eq("organization_id", org.id)
    .maybeSingle();
  if (!rubro) notFound();

  const action = editarRubro.bind(null, orgSlug, org.id, rubroId);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar rubro</h1>
      <RubroForm action={action} initialValues={rubro} submitLabel="Guardar cambios" />
    </div>
  );
}
