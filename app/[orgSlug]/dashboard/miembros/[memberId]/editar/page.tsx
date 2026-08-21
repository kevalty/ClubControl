import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarMiembro } from "@/app/[orgSlug]/dashboard/miembros/actions";
import { MiembroForm } from "@/app/[orgSlug]/dashboard/miembros/miembro-form";

export default async function EditarMiembroPage({
  params,
}: {
  params: Promise<{ orgSlug: string; memberId: string }>;
}) {
  const { orgSlug, memberId } = await params;
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("members")
    .select(
      "id, full_name, email, phone, document_id, birth_date, emergency_contact_name, emergency_contact_phone, notes"
    )
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    notFound();
  }

  const action = actualizarMiembro.bind(null, orgSlug, memberId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar miembro</h1>
      <MiembroForm action={action} initialValues={member} submitLabel="Guardar cambios" />
    </div>
  );
}
