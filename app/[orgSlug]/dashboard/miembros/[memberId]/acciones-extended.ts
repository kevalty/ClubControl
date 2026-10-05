"use server";

import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/twilio";

export async function enviarLinkInscripcion(
  orgSlug: string,
  memberId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // Prefer primary rep, fall back to any rep with a phone number.
  // Ordering by is_primary DESC puts true (primary) first.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rep } = await (supabase as any)
    .from("member_representatives")
    .select("phone, full_name")
    .eq("member_id", memberId)
    .not("phone", "is", null)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!rep) {
    return { error: "El miembro no tiene un representante con teléfono registrado." };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("slug", orgSlug)
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const link = `${appUrl}/${orgSlug}/inscripcion`;

  const body = [
    `Hola ${rep.full_name}, le invitamos a completar el formulario de inscripción de ${org?.name ?? "nuestra academia"}:`,
    "",
    link,
    "",
    "Si tiene dudas, no dude en contactarnos.",
  ].join("\n");

  const result = await sendWhatsAppMessage(rep.phone, body);
  if (!result.ok) return { error: result.error };
  return {};
}
