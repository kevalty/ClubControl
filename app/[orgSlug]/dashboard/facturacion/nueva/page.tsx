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

  const { data: miembros } = await supabase
    .from("members")
    .select("id, full_name, document_id")
    .eq("organization_id", org.id)
    .eq("status", "active")
    .order("full_name");

  const action = crearFacturaSimulada.bind(null, orgSlug, org.id);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo recibo / factura simulada</h1>
      <p className="text-sm text-amber-600 dark:text-amber-400">
        Este simulador no emite facturas válidas ante el SRI. Solo para uso interno de referencia.
      </p>
      <FacturaForm
        action={action}
        miembros={
          (miembros ?? []) as Array<{
            id: string;
            full_name: string;
            document_id: string | null;
          }>
        }
      />
    </div>
  );
}
