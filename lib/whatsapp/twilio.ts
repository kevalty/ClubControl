import { toE164Ecuador } from "@/lib/whatsapp/phone";

export type SendWhatsAppResult =
  | { ok: true }
  | { ok: false; error: string };

// CLAUDE.md §8.6: "el club debe tener una cuenta de WhatsApp Business
// verificada... mientras tanto, el sistema debe funcionar igual, solo que
// los envíos de WhatsApp fallan silenciosamente con log de error hasta que
// se conecte la cuenta." Por eso esta función NUNCA lanza (throw) — siempre
// devuelve { ok: false, error } para que el cron pueda marcar el
// payment_reminder como 'failed' con error_message y seguir con el resto.
export async function sendWhatsAppMessage(
  toPhone: string,
  body: string
): Promise<SendWhatsAppResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      ok: false,
      error: "Twilio no está configurado (faltan variables de entorno TWILIO_*).",
    };
  }

  const from = fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`;
  const to = `whatsapp:${toE164Ecuador(toPhone)}`;

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      return { ok: false, error: `Twilio respondió ${response.status}: ${errorBody.slice(0, 300)}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error de red al llamar a Twilio." };
  }
}
