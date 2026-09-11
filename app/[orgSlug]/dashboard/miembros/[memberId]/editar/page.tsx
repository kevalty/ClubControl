import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarMiembro } from "@/app/[orgSlug]/dashboard/miembros/actions";
import {
  MiembroForm,
  type ExtendedMemberValues,
} from "@/app/[orgSlug]/dashboard/miembros/miembro-form";

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
      "id, organization_id, full_name, email, phone, document_id, birth_date, school, grade, location_id, fee_type_id, notes"
    )
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    notFound();
  }

  const [
    { data: medicalInfo },
    { data: primaryRep },
    { data: locations },
    { data: feeTypes },
  ] = await Promise.all([
    supabase
      .from("member_medical_info")
      .select("blood_type, allergies, conditions, medications, notes")
      .eq("member_id", memberId)
      .maybeSingle(),
    supabase
      .from("member_representatives")
      .select("full_name, relationship, phone, email, document_id")
      .eq("member_id", memberId)
      .eq("is_primary", true)
      .maybeSingle(),
    supabase
      .from("locations")
      .select("id, name")
      .eq("organization_id", member.organization_id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("fee_types")
      .select("id, name, discount_percent")
      .eq("organization_id", member.organization_id)
      .eq("is_active", true)
      .order("name"),
  ]);

  const initialValues: ExtendedMemberValues = {
    full_name: member.full_name,
    email: member.email ?? null,
    phone: member.phone,
    document_id: member.document_id ?? null,
    birth_date: member.birth_date ?? null,
    school: member.school ?? null,
    grade: member.grade ?? null,
    location_id: member.location_id ?? null,
    fee_type_id: member.fee_type_id ?? null,
    notes: member.notes ?? null,
    blood_type: medicalInfo?.blood_type ?? null,
    allergies: medicalInfo?.allergies ?? null,
    conditions: medicalInfo?.conditions ?? null,
    medications: medicalInfo?.medications ?? null,
    medical_notes: medicalInfo?.notes ?? null,
    rep_full_name: primaryRep?.full_name ?? null,
    rep_relationship: primaryRep?.relationship ?? null,
    rep_phone: primaryRep?.phone ?? null,
    rep_email: primaryRep?.email ?? null,
    rep_document_id: primaryRep?.document_id ?? null,
  };

  const action = actualizarMiembro.bind(null, orgSlug, memberId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar miembro</h1>
      <MiembroForm
        action={action}
        initialValues={initialValues}
        submitLabel="Guardar cambios"
        locations={locations ?? []}
        feeTypes={feeTypes ?? []}
      />
    </div>
  );
}
