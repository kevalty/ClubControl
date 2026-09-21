"use server";

import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

const InscripcionSchema = z.object({
  fullName: z.string({ required_error: "Nombre requerido" }).min(2, "Nombre requerido"),
  birthDate: z.string({ required_error: "Fecha de nacimiento requerida" }).min(1, "Fecha de nacimiento requerida"),
  documentId: z.string().optional(),
  school: z.string({ required_error: "Unidad educativa requerida" }).min(1, "Unidad educativa requerida"),
  grade: z.string({ required_error: "Curso requerido" }).min(1, "Curso requerido"),
  locationId: z.string().uuid().optional().or(z.literal("")),
  feeTypeId: z.string().uuid().optional().or(z.literal("")),
  bloodType: z.string({ required_error: "Selecciona el tipo de sangre (tab Información médica)" }).min(1, "Selecciona el tipo de sangre (tab Información médica)"),
  allergies: z.string({ required_error: "Completa el campo Alergias (tab Información médica)" }).min(1, "Completa el campo Alergias (tab Información médica)"),
  conditions: z.string({ required_error: "Completa el campo Condiciones médicas (tab Información médica)" }).min(1, "Completa el campo Condiciones médicas (tab Información médica)"),
  medications: z.string().optional(),
  repFullName: z.string({ required_error: "Nombre del representante requerido (tab Representante)" }).min(2, "Nombre del representante requerido (tab Representante)"),
  repRelationship: z.string({ required_error: "Parentesco requerido (tab Representante)" }).min(1, "Parentesco requerido (tab Representante)"),
  repPhone: z.string({ required_error: "Teléfono del representante requerido (tab Representante)" }).min(7, "Teléfono del representante requerido (tab Representante)"),
  repEmail: z.string().email().optional().or(z.literal("")),
  repDocumentId: z.string().optional(),
});

export async function submitInscripcion(
  orgSlug: string,
  orgId: string,
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const raw = Object.fromEntries(formData.entries());

  const parsed = InscripcionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const d = parsed.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;

  const { data: member, error: memberError } = await supabase
    .from("members")
    .insert({
      organization_id: orgId,
      full_name: d.fullName,
      phone: d.repPhone,
      birth_date: d.birthDate || null,
      document_id: d.documentId || null,
      school: d.school,
      grade: d.grade,
      location_id: d.locationId || null,
      fee_type_id: d.feeTypeId || null,
      registration_status: "pending_approval",
      status: "inactive",
    })
    .select("id")
    .single();

  if (memberError || !member) {
    console.error("[inscripcion] memberError:", memberError);
    return { error: "Error al guardar la solicitud. Intenta de nuevo." };
  }

  const { error: medError } = await supabase.from("member_medical_info").insert({
    member_id: member.id,
    blood_type: d.bloodType,
    allergies: d.allergies,
    conditions: d.conditions,
    medications: d.medications || null,
  });
  if (medError) {
    console.error("[inscripcion] medError:", JSON.stringify(medError));
    return { error: `Error guardando info médica: ${medError.message} (código: ${medError.code})` };
  }

  const { error: repError } = await supabase.from("member_representatives").insert({
    member_id: member.id,
    full_name: d.repFullName,
    relationship: d.repRelationship,
    phone: d.repPhone,
    email: d.repEmail || null,
    document_id: d.repDocumentId || null,
    is_primary: true,
  });
  if (repError) {
    console.error("[inscripcion] repError:", JSON.stringify(repError));
    return { error: `Error guardando representante: ${repError.message} (código: ${repError.code})` };
  }

  const { data: admins } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .in("role", ["owner", "admin"])
    .eq("status", "active");

  if (admins?.length) {
    const memberLink = `/${orgSlug}/dashboard/miembros/${member.id}`;
    await supabase.from("notifications").insert(
      admins.map((a: { user_id: string }) => ({
        organization_id: orgId,
        user_id: a.user_id,
        member_id: member.id,
        title: "Nueva solicitud de inscripción",
        body: `${d.fullName} completó el formulario de inscripción y está pendiente de aprobación.`,
        link: memberLink,
      }))
    );
  }

  return { success: true };
}
