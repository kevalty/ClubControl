"use server";
import { createClient } from "@/lib/supabase/server";

function toCSV(headers: string[], rows: (string | number | null)[][]): string {
  const escape = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}

export async function exportarInscripciones(
  orgId: string, desde: string, hasta: string
): Promise<{ csv: string } | { error: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("memberships")
    .select("start_date, members(full_name), membership_plans(name)")
    .eq("organization_id", orgId)
    .gte("start_date", desde)
    .lte("start_date", hasta)
    .order("start_date")
    .limit(5000);
  if (error) return { error: "Error al generar el reporte." };
  const rows = (data ?? []).map((r: { start_date: string; members: { full_name: string } | null; membership_plans: { name: string } | null }) => [
    r.start_date,
    r.members?.full_name ?? "",
    r.membership_plans?.name ?? "",
  ]);
  return { csv: toCSV(["Fecha Inscripción", "Miembro", "Plan"], rows) };
}

export async function exportarIngresos(
  orgId: string, desde: string, hasta: string
): Promise<{ csv: string } | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("created_at, amount, method, reference_number, members(full_name)")
    .eq("organization_id", orgId)
    .eq("status", "approved")
    .gte("created_at", desde)
    .lte("created_at", hasta + "T23:59:59Z")
    .order("created_at")
    .limit(5000);
  if (error) return { error: "Error al generar el reporte." };
  const rows = (data ?? []).map((r) => [
    new Date(r.created_at).toLocaleDateString("es-EC"),
    (r.members as { full_name: string } | null)?.full_name ?? "",
    Number(r.amount).toFixed(2),
    r.method,
    r.reference_number ?? "",
  ]);
  return { csv: toCSV(["Fecha", "Miembro", "Monto (USD)", "Método", "Referencia"], rows) };
}

export async function exportarAsistencia(
  orgId: string, classId: string, desde: string, hasta: string
): Promise<{ csv: string } | { error: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("class_bookings")
    .select("status, member_id, members(full_name), class_sessions!inner(session_date, class_id)")
    .eq("class_sessions.class_id", classId)
    .eq("organization_id", orgId)
    .gte("class_sessions.session_date", desde)
    .lte("class_sessions.session_date", hasta)
    .limit(10000);
  if (error) return { error: "Error al generar el reporte de asistencia." };

  const map = new Map<string, { name: string; attended: number; no_show: number; justified: number }>();
  for (const row of data ?? []) {
    const id = row.member_id as string;
    const name = (row.members as { full_name: string } | null)?.full_name ?? id;
    if (!map.has(id)) map.set(id, { name, attended: 0, no_show: 0, justified: 0 });
    const entry = map.get(id)!;
    if (row.status === "attended") entry.attended++;
    else if (row.status === "no_show") entry.no_show++;
    else if (row.status === "justified") entry.justified++;
  }
  const rows = Array.from(map.values()).map((e) => [e.name, e.attended, e.no_show, e.justified, e.attended + e.no_show + e.justified]);
  return { csv: toCSV(["Miembro", "Presentes", "Ausentes", "Justificados", "Total sesiones"], rows) };
}
