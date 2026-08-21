"use server";

import { createClient } from "@/lib/supabase/server";

export async function solicitarRecuperacion(
  _prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Ingresa tu correo electrónico." };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // No se revela si el correo existe o no (evita enumeración de usuarios):
  // siempre se responde con el mismo mensaje de éxito.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/actualizar-password`,
  });

  return { ok: true };
}
