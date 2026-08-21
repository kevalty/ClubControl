"use server";

import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/twilio";

export async function enviarAnuncio(
  orgId: string,
  _prevState: { error?: string; resultado?: string } | undefined,
  formData: FormData
) {
  const mensaje = String(formData.get("mensaje") ?? "").trim();
  const planId = String(formData.get("planId") ?? "");

  if (!mensaje) {
    return { error: "Escribe el mensaje a enviar." };
  }

  const supabase = await createClient();

  let miembros: { id: string; full_name: string; phone: string }[] = [];

  if (planId && planId !== "todos") {
    const { data } = await supabase
      .from("memberships")
      .select("members(id, full_name, phone)")
      .eq("organization_id", orgId)
      .eq("plan_id", planId)
      .eq("status", "active");
    miembros = (data ?? [])
      .map((m) => m.members as unknown as { id: string; full_name: string; phone: string } | null)
      .filter((m): m is { id: string; full_name: string; phone: string } => !!m);
  } else {
    const { data } = await supabase
      .from("members")
      .select("id, full_name, phone")
      .eq("organization_id", orgId)
      .eq("status", "active");
    miembros = data ?? [];
  }

  // Dedup (un miembro puede tener más de una membresía del mismo plan).
  const unicos = Array.from(new Map(miembros.map((m) => [m.id, m])).values());

  let enviados = 0;
  let fallidos = 0;
  for (const miembro of unicos) {
    const result = await sendWhatsAppMessage(miembro.phone, mensaje);
    if (result.ok) enviados++;
    else fallidos++;
  }

  return {
    resultado: `Enviado a ${enviados} de ${unicos.length} miembros.${
      fallidos > 0 ? ` ${fallidos} fallaron (revisa que WhatsApp esté conectado).` : ""
    }`,
  };
}
