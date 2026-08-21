import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendWhatsAppMessage } from "@/lib/whatsapp/twilio";
import { renderTemplate } from "@/lib/whatsapp/templates";

// CLAUDE.md §8.6: job diario que recorre payment_reminders con
// scheduled_at <= now() y status = 'scheduled', envía el WhatsApp, y marca
// sent/failed. Los recordatorios que ya no aplican (el miembro renovó a
// tiempo) se cancelan proactivamente en approve_payment — este cron no
// necesita re-chequear estado de membresía, solo procesa lo que sigue
// 'scheduled'.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: reminders, error } = await supabase
    .from("payment_reminders")
    .select("id, organization_id, member_id, payment_id, template_key")
    .eq("status", "scheduled")
    .eq("channel", "whatsapp")
    .lte("scheduled_at", new Date().toISOString())
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const reminder of reminders ?? []) {
    const result = await procesarRecordatorio(supabase, reminder);
    if (result.ok) sent++;
    else failed++;
  }

  return NextResponse.json({ processed: reminders?.length ?? 0, sent, failed });
}

async function procesarRecordatorio(
  supabase: ReturnType<typeof createServiceClient>,
  reminder: {
    id: string;
    organization_id: string;
    member_id: string;
    payment_id: string | null;
    template_key: string;
  }
): Promise<{ ok: boolean }> {
  const [{ data: member }, { data: org }, { data: template }] = await Promise.all([
    supabase
      .from("members")
      .select("full_name, phone")
      .eq("id", reminder.member_id)
      .maybeSingle(),
    supabase.from("organizations").select("name").eq("id", reminder.organization_id).single(),
    supabase
      .from("whatsapp_templates")
      .select("content")
      .eq("key", reminder.template_key)
      .or(`organization_id.eq.${reminder.organization_id},organization_id.is.null`)
      .eq("is_active", true)
      .order("organization_id", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!member || !template) {
    await supabase
      .from("payment_reminders")
      .update({ status: "failed", error_message: "Miembro o plantilla no encontrados." })
      .eq("id", reminder.id);
    return { ok: false };
  }

  const variables: Record<string, string> = {
    nombre: member.full_name,
    club: org?.name ?? "",
  };

  if (reminder.payment_id) {
    const { data: payment } = await supabase
      .from("payments")
      .select("amount")
      .eq("id", reminder.payment_id)
      .maybeSingle();
    if (payment) variables.monto = `$${Number(payment.amount).toFixed(2)}`;
  }

  if (!variables.monto || reminder.template_key.startsWith("recordatorio")) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("end_date, membership_plans(price)")
      .eq("member_id", reminder.member_id)
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (membership) {
      variables.fecha_vencimiento = membership.end_date;
      const price = (membership.membership_plans as unknown as { price: number } | null)?.price;
      if (price != null) variables.monto = `$${Number(price).toFixed(2)}`;
    }
  }
  variables.link_pago = "";

  const body = renderTemplate(template.content, variables);
  const result = await sendWhatsAppMessage(member.phone, body);

  await supabase
    .from("payment_reminders")
    .update(
      result.ok
        ? { status: "sent", sent_at: new Date().toISOString() }
        : { status: "failed", error_message: result.error }
    )
    .eq("id", reminder.id);

  return { ok: result.ok };
}
