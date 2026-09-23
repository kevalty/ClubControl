import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

const DAY_MAP: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function nextOccurrences(days: string[], weeksAhead: number): string[] {
  const now = new Date();
  const results: string[] = [];
  for (let d = 0; d <= weeksAhead * 7; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);
    const dayNum = date.getDay();
    const dayKey = Object.entries(DAY_MAP).find(([, v]) => v === dayNum)?.[0];
    if (dayKey && days.includes(dayKey)) {
      results.push(date.toISOString().slice(0, 10));
    }
  }
  return results;
}

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;

  const { data: classes } = await supabase
    .from("classes")
    .select("id, organization_id, recurrence_rule")
    .eq("is_active", true);

  if (!classes?.length) return NextResponse.json({ sessionsCreated: 0 });

  const classIds = classes.map((c: { id: string }) => c.id);
  const today = new Date().toISOString().slice(0, 10);
  const in8days = new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("class_sessions")
    .select("class_id, session_date")
    .in("class_id", classIds)
    .gte("session_date", today)
    .lte("session_date", in8days);

  const existingSet = new Set(
    (existing ?? []).map((s: { class_id: string; session_date: string }) => `${s.class_id}|${s.session_date}`)
  );

  const inserts = [];
  for (const cls of classes) {
    const rule = cls.recurrence_rule as { days: string[]; start_time: string; end_time: string };
    if (!rule?.days?.length) continue;
    const dates = nextOccurrences(rule.days, 1);
    for (const date of dates) {
      if (existingSet.has(`${cls.id}|${date}`)) continue;
      const autoCloseAt = new Date(`${date}T05:00:00Z`); // midnight Ecuador = 05:00 UTC
      autoCloseAt.setDate(autoCloseAt.getDate() + 1);
      inserts.push({
        class_id: cls.id,
        organization_id: cls.organization_id,
        session_date: date,
        start_time: rule.start_time,
        end_time: rule.end_time,
        status: "scheduled",
        auto_close_at: autoCloseAt.toISOString(),
      });
    }
  }

  if (inserts.length) {
    await supabase.from("class_sessions").insert(inserts);
  }

  return NextResponse.json({ sessionsCreated: inserts.length });
}
