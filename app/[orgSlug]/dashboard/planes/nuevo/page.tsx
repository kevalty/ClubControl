import { createClient } from "@/lib/supabase/server";
import { crearPlan } from "@/app/[orgSlug]/dashboard/planes/actions";
import { PlanForm } from "@/app/[orgSlug]/dashboard/planes/plan-form";

export default async function NuevoPlanPage({
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

  const action = crearPlan.bind(null, orgSlug, org!.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo plan de membresía</h1>
      <PlanForm action={action} submitLabel="Crear plan" />
    </div>
  );
}
