import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { editarSede } from "../../actions";
import { SedeForm } from "../../sede-form";

export default async function EditarSedeePage({
  params,
}: {
  params: Promise<{ orgSlug: string; sedeId: string }>;
}) {
  const { orgSlug, sedeId } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sede } = await (supabase as any)
    .from("locations")
    .select("id, name, address, phone")
    .eq("id", sedeId)
    .eq("organization_id", org.id)
    .maybeSingle();
  if (!sede) notFound();

  const action = editarSede.bind(null, orgSlug, org.id, sedeId);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar sede</h1>
      <SedeForm action={action} initialValues={sede} submitLabel="Guardar cambios" />
    </div>
  );
}
