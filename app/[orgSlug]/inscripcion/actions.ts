"use server";

import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

const InscripcionSchema = z.object({
  fullName: z.string().min(2, "Nombre requerido"),
  birthDate: z.string().min(1, "Fecha de nacimiento requerida"),
  documentId: z.string().optional(),
  school: z.string().min(1, "Unidad educativa requerida"),
  grade: z.string().min(1, "Curso requerido"),
  locationId: z.string().uuid().optional().or(z.literal("")),
  bloodType: z.string().min(1, "Tipo de sangre requerido"),
  allergies: z.string().min(1, "Campo requerido"),
  conditions: z.string().min(1, "Campo requerido"),
  medications: z.string().optional(),
  repFullName: z.string().min(2, "Nombre del representante requerido"),
  repRelationship: z.string().min(1, "Parentesco requerido"),
  repPhone: z.string().min(7, "Teléfono del representante requerido"),
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
  // service client: public route has no auth session — bypasses RLS safely
  const supabase = createServiceClient();

  // Insert member with registration_status = 'pending_approval'
  const { data: member, error: memberError } = await supabase
    .from("members")
    .insert({
      organization_id: orgId,
      full_name: d.fullName,
      phone: d.repPhone, // representative's phone as primary contact
      birth_date: d.birthDate || null,
      document_id: d.documentId || null,
      school: d.school,
      grade: d.grade,
      location_id: d.locationId || null,
      registration_status: "pending_approval",
      status: "inactive", // inactive until approved
    })
    .select("id")
    .single();

  if (memberError || !member) {
    console.error("[inscripcion] memberError:", memberError);
    return { error: "Error al guardar la solicitud. Intenta de nuevo." };
  }

  // Insert medical info (ignore individual errors — don't block submission)
  await supabase.from("member_medical_info").insert({
    member_id: member.id,
    blood_type: d.bloodType,
    allergies: d.allergies,
    conditions: d.conditions,
    medications: d.medications || null,
  });

  // Insert primary representative
  await supabase.from("member_representatives").insert({
    member_id: member.id,
    full_name: d.repFullName,
    relationship: d.repRelationship,
    phone: d.repPhone,
    email: d.repEmail || null,
    document_id: d.repDocumentId || null,
    is_primary: true,
  });

  // Notify owners/admins of the org in-app
  const { data: admins } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .in("role", ["owner", "admin"])
    .eq("status", "active");

  if (admins?.length) {
    await supabase.from("notifications").insert(
      admins.map((a) => ({
        organization_id: orgId,
        user_id: a.user_id,
        title: "Nueva solicitud de inscripción",
        body: `${d.fullName} completó el formulario de inscripción y está pendiente de aprobación.`,
      }))
    );
  }

  return { success: true };
}
