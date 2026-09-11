"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const FacturaSchema = z.object({
  recipient_name: z.string().min(1, "Nombre del receptor requerido"),
  recipient_document: z.string().min(1, "Cédula/RUC requerido"),
  recipient_address: z.string().optional(),
  concept: z.string().min(1, "Concepto requerido"),
  subtotal: z.coerce.number().positive("El subtotal debe ser mayor a 0"),
});

export async function crearFacturaSimulada(
  orgSlug: string,
  orgId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = FacturaSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data: authUser } = await supabase.auth.getUser();

  // Get next sequential number for this org
  const { count } = await supabase
    .from("sim_invoices")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  const sequential = (count ?? 0) + 1;
  const { data: d } = parsed;
  const tax_amount = Number((d.subtotal * 0.15).toFixed(2));
  const total = Number((d.subtotal + tax_amount).toFixed(2));

  const { error } = await supabase.from("sim_invoices").insert({
    organization_id: orgId,
    sequential_number: sequential,
    recipient_name: d.recipient_name,
    recipient_document: d.recipient_document,
    recipient_address: d.recipient_address || null,
    concept: d.concept,
    subtotal: d.subtotal,
    tax_rate: 15.00,
    tax_amount,
    total,
    created_by: authUser.user?.id ?? null,
  });

  if (error) return { error: error.message };
  redirect(`/${orgSlug}/dashboard/facturacion`);
}
