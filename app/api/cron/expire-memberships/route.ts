import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// CLAUDE.md §6.1: job diario que marca como 'expired' toda membership cuyo
// end_date < hoy y status = 'active'. Si el miembro se queda sin ninguna
// membresía activa, member.status también pasa a 'expired'.
// Protegido con CRON_SECRET (CLAUDE.md §11.1: nunca confiar solo en el
// frontend) — usa el service_role client porque no hay sesión de usuario.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: expiredMemberships, error } = await supabase
    .from("memberships")
    .update({ status: "expired" })
    .lt("end_date", today)
    .eq("status", "active")
    .select("id, member_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const affectedMemberIds = [...new Set((expiredMemberships ?? []).map((m) => m.member_id))];
  let membersExpired = 0;

  for (const memberId of affectedMemberIds) {
    const { count } = await supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("member_id", memberId)
      .eq("status", "active");

    if (!count) {
      await supabase.from("members").update({ status: "expired" }).eq("id", memberId);
      membersExpired++;
    }
  }

  return NextResponse.json({
    membershipsExpired: expiredMemberships?.length ?? 0,
    membersExpired,
  });
}
