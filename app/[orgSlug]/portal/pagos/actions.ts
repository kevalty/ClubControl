"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { registrarPagoSchema } from "@/lib/validations/payment";

export async function registrarPagoPropio(
  orgSlug: string,
  orgId: string,
  memberId: string,
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const parsed = registrarPagoSchema.safeParse({
    memberId,
    amount: formData.get("amount"),
    method: "bank_transfer",
    referenceNumber: formData.get("referenceNumber") || undefined,
    membershipId: formData.get("membershipId") || undefined,
    planId: formData.get("planId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { amount, referenceNumber, membershipId, planId } = parsed.data;
  if (!membershipId && !planId) {
    return { error: "Selecciona a qué membresía o plan corresponde este pago." };
  }

  const supabase = await createClient();

  const proofFile = formData.get("proof") as File | null;
  if (!proofFile || proofFile.size === 0) {
    return { error: "Sube una foto o PDF de tu comprobante de transferencia." };
  }

  const path = `${orgId}/${memberId}/${Date.now()}.${proofFile.name.split(".").pop()}`;
  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(path, proofFile);

  if (uploadError) {
    return { error: "No se pudo subir el comprobante." };
  }

  const { error } = await supabase.from("payments").insert({
    organization_id: orgId,
    member_id: memberId,
    membership_id: membershipId || null,
    plan_id: planId || null,
    amount,
    method: "bank_transfer",
    reference_number: referenceNumber || null,
    proof_url: path,
  });

  if (error) {
    return { error: "No se pudo registrar el pago." };
  }

  revalidatePath(`/${orgSlug}/portal/pagos`);
  return { ok: true };
}

export async function obtenerUrlComprobantePropio(proofPath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(proofPath, 60);

  if (error || !data) {
    return { error: "No se pudo generar el enlace del comprobante." };
  }

  return { url: data.signedUrl };
}
