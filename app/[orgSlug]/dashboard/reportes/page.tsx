import { createClient } from "@/lib/supabase/server";
import { ReportesClient } from "./reportes-client";

export default async function ReportesPage({
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

  const { data: clases } = await supabase
    .from("classes")
    .select("id, name")
    .eq("organization_id", org?.id ?? "")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
        <p className="text-sm text-[#6b7280]">
          Exporta datos de ingresos, inscripciones y asistencia a CSV.
        </p>
      </div>
      <ReportesClient orgId={org?.id ?? ""} clases={clases ?? []} />
    </div>
  );
}
