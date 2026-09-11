import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { crearFacturaSimulada } from "../actions";
import { FacturaForm } from "./factura-form";

export default async function NuevaFacturaPage({
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

  const action = crearFacturaSimulada.bind(null, orgSlug, org.id);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nueva factura simulada</h1>
      <FacturaForm action={action} />
    </div>
  );
}
