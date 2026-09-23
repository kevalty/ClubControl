"use server";

import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

async function uploadDoc(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  memberId: string,
  orgId: string,
  file: File,
  slot: string
): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${orgId}/${memberId}/${slot}.${ext}`;
  const { error } = await supabase.storage
    .from("member-documents")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) {
    console.error("[inscripcion] upload error:", error);
    return null;
  }
  return path;
}

const InscripcionSchema = z.object({
  fullName: z.string().min(2, "Nombre requerido"),
  birthDate: z.string().min(1, "Fecha de nacimiento requerida"),
  documentId: z.string().min(5, "Cédula del estudiante requerida (tab Datos del estudiante)"),
  school: z.string().min(1, "Unidad educativa requerida"),
  grade: z.string().min(1, "Curso requerido"),
  locationId: z.string().uuid().optional().or(z.literal("")),
  feeTypeId: z.string().uuid().optional().or(z.literal("")),
  bloodType: z.string().min(1, "Selecciona el tipo de sangre (tab Información médica)"),
  allergies: z.string().min(1, "Completa el campo Alergias (tab Información médica)"),
  conditions: z.string().min(1, "Completa el campo Condiciones médicas (tab Información médica)"),
  medications: z.string().optional(),
  repFullName: z.string().min(2, "Nombre del representante requerido (tab Representante)"),
  repRelationship: z.string().min(1, "Parentesco requerido (tab Representante)"),
  repPhone: z.string().min(7, "Teléfono del representante requerido (tab Representante)"),
  repEmail: z.string().email("Correo del representante inválido (tab Representante)").min(1, "Correo del representante requerido (tab Representante)"),
  repDocumentId: z.string().min(5, "Cédula del representante requerida (tab Representante)"),
});

export async function submitInscripcion(
  orgSlug: string,
  orgId: string,
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  // Extract files before Zod parse (Zod cannot handle File objects)
  const cedulaEstudianteFile = formData.get("cedulaEstudiante") as File | null;
  const cedulaRepresentanteFile = formData.get("cedulaRepresentante") as File | null;
  const fotoEstudianteFile = formData.get("fotoEstudiante") as File | null;

  if (!cedulaEstudianteFile || cedulaEstudianteFile.size === 0)
    return { error: "La cédula del estudiante es obligatoria (tab Documentos)." };
  if (!cedulaRepresentanteFile || cedulaRepresentanteFile.size === 0)
    return { error: "La cédula del representante es obligatoria (tab Documentos)." };
  if (!fotoEstudianteFile || fotoEstudianteFile.size === 0)
    return { error: "La foto del estudiante es obligatoria (tab Documentos)." };

  const raw = Object.fromEntries(formData.entries());

  const parsed = InscripcionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const d = parsed.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;

  // ── Validar cédula del estudiante única dentro de la organización ──
  const { data: dupStudent } = await supabase
    .from("members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("document_id", d.documentId)
    .maybeSingle();
  if (dupStudent) {
    return {
      error:
        "Ya existe un deportista registrado con esa cédula (tab Datos del estudiante). Si ya tiene una inscripción anterior, contacta al administrador del club.",
    };
  }

  // ── Validar cédula del representante única dentro de la organización ──
  const { data: orgMemberRows } = await supabase
    .from("members")
    .select("id")
    .eq("organization_id", orgId);
  const orgMemberIds: string[] = (orgMemberRows ?? []).map(
    (m: { id: string }) => m.id
  );
  if (orgMemberIds.length > 0) {
    const { data: dupRep } = await supabase
      .from("member_representatives")
      .select("id")
      .in("member_id", orgMemberIds)
      .eq("document_id", d.repDocumentId)
      .maybeSingle();
    if (dupRep) {
      return {
        error:
          "Ya existe un representante registrado con esa cédula (tab Representante). Si ya figura como representante de otro deportista, contacta al administrador.",
      };
    }
  }

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

  // Upload documents — fatal if any fails (documents are mandatory)
  const [cedulaEstudiantePath, fotoPath] = await Promise.all([
    uploadDoc(supabase, member.id, orgId, cedulaEstudianteFile, "cedula_estudiante"),
    uploadDoc(supabase, member.id, orgId, fotoEstudianteFile, "foto"),
  ]);
  const cedulaRepPath = await uploadDoc(supabase, member.id, orgId, cedulaRepresentanteFile, "cedula_rep");

  if (!cedulaEstudiantePath || !fotoPath || !cedulaRepPath) {
    // Roll back: delete the member created above so the form can be retried
    await supabase.from("members").delete().eq("id", member.id);
    return { error: "Error al subir los documentos. Verifica que el formato sea válido (imagen o PDF) e intenta de nuevo." };
  }

  await supabase.from("members").update({
    cedula_url: cedulaEstudiantePath,
    photo_url: fotoPath,
  }).eq("id", member.id);

  const { error: medError } = await supabase.from("member_medical_info").insert({
    member_id: member.id,
    blood_type: d.bloodType,
    allergies: d.allergies,
    conditions: d.conditions,
    medications: d.medications || null,
  });
  if (medError) {
    // Rollback: delete member (cascades medical info)
    await supabase.from("members").delete().eq("id", member.id);
    console.error("[inscripcion] medError:", JSON.stringify(medError));
    return { error: "Error al guardar la información médica. Intenta de nuevo." };
  }

  const { error: repError } = await supabase.from("member_representatives").insert({
    member_id: member.id,
    full_name: d.repFullName,
    relationship: d.repRelationship,
    phone: d.repPhone,
    email: d.repEmail || null,
    document_id: d.repDocumentId || null,
    cedula_url: cedulaRepPath,
    is_primary: true,
  });
  if (repError) {
    // Rollback: delete member (cascades medical info and representative)
    await supabase.from("members").delete().eq("id", member.id);
    console.error("[inscripcion] repError:", JSON.stringify(repError));
    return { error: "Error al guardar los datos del representante. Intenta de nuevo." };
  }

  const { data: admins } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .in("role", ["owner", "admin"])
    .eq("status", "active");

  if (admins?.length) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const memberLink = `${appUrl}/${orgSlug}/dashboard/miembros/${member.id}`;
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
