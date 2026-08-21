"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function aprobarPagoPlataforma(paymentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_platform_payment", {
    p_payment_id: paymentId,
  });

  if (error) {
    return { error: error.message || "No se pudo aprobar el pago." };
  }

  revalidatePath("/admin/pagos");
  return { ok: true };
}

export async function rechazarPagoPlataforma(paymentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_platform_payment", {
    p_payment_id: paymentId,
  });

  if (error) {
    return { error: error.message || "No se pudo rechazar el pago." };
  }

  revalidatePath("/admin/pagos");
  return { ok: true };
}

export async function obtenerUrlComprobantePlataforma(proofPath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(proofPath, 60);

  if (error || !data) {
    return { error: "No se pudo generar el enlace del comprobante." };
  }

  return { url: data.signedUrl };
}
