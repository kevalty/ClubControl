"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { registrarPagoPlataformaSchema } from "@/lib/validations/platform-payment";

export async function registrarPagoSuscripcion(
  orgSlug: string,
  orgId: string,
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const parsed = registrarPagoPlataformaSchema.safeParse({
    planId: formData.get("planId"),
    amount: formData.get("amount"),
    referenceNumber: formData.get("referenceNumber") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();

  let proofPath: string | null = null;
  const proofFile = formData.get("proof") as File | null;
  if (proofFile && proofFile.size > 0) {
    const path = `${orgId}/${Date.now()}.${proofFile.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(path, proofFile);
    if (uploadError) {
      return { error: "No se pudo subir el comprobante." };
    }
    proofPath = path;
  }

  const { error } = await supabase.from("platform_payments").insert({
    organization_id: orgId,
    plan_id: parsed.data.planId,
    amount: parsed.data.amount,
    reference_number: parsed.data.referenceNumber || null,
    proof_url: proofPath,
  });

  if (error) {
    return { error: "No se pudo registrar el pago." };
  }

  revalidatePath(`/${orgSlug}/dashboard/configuracion/suscripcion`);
  return { ok: true };
}
