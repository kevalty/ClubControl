"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registrarPagoSchema } from "@/lib/validations/payment";

export async function registrarPago(
  orgSlug: string,
  orgId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const parsed = registrarPagoSchema.safeParse({
    memberId: formData.get("memberId"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    referenceNumber: formData.get("referenceNumber") || undefined,
    membershipId: formData.get("membershipId") || undefined,
    planId: formData.get("planId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { memberId, amount, method, referenceNumber, membershipId, planId } = parsed.data;

  if (!membershipId && !planId) {
    return { error: "Selecciona a qué membresía o plan corresponde este pago." };
  }

  const supabase = await createClient();

  const proofFile = formData.get("proof") as File | null;
  let proofPath: string | null = null;

  if (proofFile && proofFile.size > 0) {
    const path = `${orgId}/${memberId}-${Date.now()}.${proofFile.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(path, proofFile);

    if (uploadError) {
      return { error: "No se pudo subir el comprobante." };
    }
    proofPath = path;
  }

  const { error } = await supabase.from("payments").insert({
    organization_id: orgId,
    member_id: memberId,
    membership_id: membershipId || null,
    plan_id: planId || null,
    amount,
    method,
    reference_number: referenceNumber || null,
    proof_url: proofPath,
  });

  if (error) {
    return { error: "No se pudo registrar el pago." };
  }

  revalidatePath(`/${orgSlug}/dashboard/pagos`);
  redirect(`/${orgSlug}/dashboard/pagos`);
}

export async function aprobarPago(orgSlug: string, paymentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_payment", { p_payment_id: paymentId });

  if (error) {
    return { error: error.message || "No se pudo aprobar el pago." };
  }

  revalidatePath(`/${orgSlug}/dashboard/pagos`);
  return { ok: true };
}

export async function rechazarPago(orgSlug: string, paymentId: string, motivo?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_payment", {
    p_payment_id: paymentId,
    p_reason: motivo || undefined,
  });

  if (error) {
    return { error: error.message || "No se pudo rechazar el pago." };
  }

  revalidatePath(`/${orgSlug}/dashboard/pagos`);
  return { ok: true };
}

export async function obtenerUrlComprobante(proofPath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(proofPath, 60); // 60s, ver CLAUDE.md §11.1 (URLs firmadas de corta duración)

  if (error || !data) {
    return { error: "No se pudo generar el enlace del comprobante." };
  }

  return { url: data.signedUrl };
}
