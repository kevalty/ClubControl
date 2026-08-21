"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bankAccountSchema } from "@/lib/validations/bank-account";

export async function crearCuentaBancaria(
  orgSlug: string,
  orgId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const parsed = bankAccountSchema.safeParse({
    bankName: formData.get("bankName"),
    accountType: formData.get("accountType"),
    accountNumber: formData.get("accountNumber"),
    accountHolderName: formData.get("accountHolderName"),
    accountHolderDocument: formData.get("accountHolderDocument"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bank_accounts").insert({
    organization_id: orgId,
    bank_name: parsed.data.bankName,
    account_type: parsed.data.accountType,
    account_number: parsed.data.accountNumber,
    account_holder_name: parsed.data.accountHolderName,
    account_holder_document: parsed.data.accountHolderDocument,
  });

  if (error) {
    return { error: "No se pudo guardar la cuenta bancaria." };
  }

  revalidatePath(`/${orgSlug}/dashboard/configuracion/pagos`);
  return { ok: true };
}

export async function alternarActivaCuentaBancaria(
  orgSlug: string,
  accountId: string,
  activar: boolean
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bank_accounts")
    .update({ is_active: activar })
    .eq("id", accountId);

  if (error) {
    return { error: "No se pudo actualizar la cuenta." };
  }

  revalidatePath(`/${orgSlug}/dashboard/configuracion/pagos`);
  return { ok: true };
}
