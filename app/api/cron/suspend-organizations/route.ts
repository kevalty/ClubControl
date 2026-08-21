import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// CLAUDE.md §6.7: si organization_subscriptions.status = 'past_due' por más
// de 7 días, el club pasa a organizations.status = 'suspended'.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("suspend_past_due_organizations");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ suspended: data });
}
