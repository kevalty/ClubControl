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
  const { data: sede } = await supabase
    .from("locations")
    .select("id, name, address, phone")
    .eq("id", sedeId)
    .maybeSingle();
  if (!sede) notFound();

  const action = editarSede.bind(null, orgSlug, sedeId);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar sede</h1>
      <SedeForm action={action} initialValues={sede} submitLabel="Guardar cambios" />
    </div>
  );
}
