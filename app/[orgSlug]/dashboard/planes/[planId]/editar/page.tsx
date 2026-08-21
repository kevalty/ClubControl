import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarPlan } from "@/app/[orgSlug]/dashboard/planes/actions";
import { PlanForm } from "@/app/[orgSlug]/dashboard/planes/plan-form";

export default async function EditarPlanPage({
  params,
}: {
  params: Promise<{ orgSlug: string; planId: string }>;
}) {
  const { orgSlug, planId } = await params;
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("membership_plans")
    .select("id, name, description, price, billing_cycle, sessions_included, duration_days")
    .eq("id", planId)
    .maybeSingle();

  if (!plan) {
    notFound();
  }

  const action = actualizarPlan.bind(null, orgSlug, planId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar plan</h1>
      <PlanForm action={action} initialValues={plan} submitLabel="Guardar cambios" />
    </div>
  );
}
