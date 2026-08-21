import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgMembersWithNames } from "@/lib/organization-members";
import { actualizarClase } from "@/app/[orgSlug]/dashboard/clases/actions";
import { ClaseForm } from "@/app/[orgSlug]/dashboard/clases/clase-form";

export default async function EditarClasePage({
  params,
}: {
  params: Promise<{ orgSlug: string; classId: string }>;
}) {
  const { orgSlug, classId } = await params;
  const supabase = await createClient();

  const { data: clase } = await supabase
    .from("classes")
    .select("id, organization_id, name, description, trainer_user_id, capacity, location, recurrence_rule")
    .eq("id", classId)
    .maybeSingle();

  if (!clase) {
    notFound();
  }

  const entrenadores = await getOrgMembersWithNames(clase.organization_id, [
    "trainer",
    "owner",
    "admin",
  ]);
  const action = actualizarClase.bind(null, orgSlug, classId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar clase</h1>
      <ClaseForm
        action={action}
        initialValues={{
          ...clase,
          recurrence_rule: clase.recurrence_rule as unknown as {
            days: string[];
            start_time: string;
            end_time: string;
          },
        }}
        entrenadores={entrenadores}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
