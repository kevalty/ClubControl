"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const pagoRapidoSchema = z.object({
  planId: z.string().uuid("Selecciona un plan válido."),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  method: z.enum(["cash", "bank_transfer", "other"]).refine((v) => v !== undefined, {
    message: "Método de pago inválido.",
  }),
  referenceNumber: z.string().optional(),
});

export async function registrarPagoRapido(
  orgSlug: string,
  orgId: string,
  memberId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = pagoRapidoSchema.safeParse({
    planId: formData.get("planId"),
    amount: formData.get("amount"),
    method: formData.get("method") || "cash",
    referenceNumber: formData.get("referenceNumber") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();

  // 1. Create payment record (plan_id is a stale-type column — cast to any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payment, error: paymentError } = await (supabase as any)
    .from("payments")
    .insert({
      organization_id: orgId,
      member_id: memberId,
      plan_id: parsed.data.planId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      reference_number: parsed.data.referenceNumber || null,
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    return { error: "No se pudo registrar el pago." };
  }

  // 2. Approve immediately — approve_payment is SECURITY DEFINER so it creates
  //    the membership and schedules WhatsApp reminders automatically.
  const { error: rpcError } = await supabase.rpc("approve_payment", {
    p_payment_id: payment.id,
  });

  if (rpcError) {
    await supabase.from("payments").delete().eq("id", payment.id);
    return { error: "No se pudo activar la membresía. " + rpcError.message };
  }

  revalidatePath(`/${orgSlug}/dashboard/miembros/${memberId}`);
  return {};
}
