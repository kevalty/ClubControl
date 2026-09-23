import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AsistenciaHistorialPage({
  params,
}: {
  params: Promise<{ orgSlug: string; classId: string }>;
}) {
  const { orgSlug, classId } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) notFound();

  const { data: clase } = await supabase
    .from("classes")
    .select("id, name")
    .eq("id", classId)
    .eq("organization_id", org.id)
    .maybeSingle();
  if (!clase) notFound();

  // Fetch all sessions for this class
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions } = await (supabase as any)
    .from("class_sessions")
    .select("id, session_date, start_time, end_time, status")
    .eq("class_id", classId)
    .eq("organization_id", org.id)
    .order("session_date", { ascending: false });

  const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id);

  // Fetch all bookings for those sessions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bookings } = await (supabase as any)
    .from("class_bookings")
    .select("class_session_id, status, members(full_name)")
    .in(
      "class_session_id",
      sessionIds.length
        ? sessionIds
        : ["00000000-0000-0000-0000-000000000000"]
    );

  // Build per-session stats
  type SessionStats = {
    attended: number;
    no_show: number;
    justified: number;
    total: number;
  };

  const statsMap = new Map<string, SessionStats>();
  for (const b of bookings ?? []) {
    const sid = b.class_session_id as string;
    if (!statsMap.has(sid)) {
      statsMap.set(sid, { attended: 0, no_show: 0, justified: 0, total: 0 });
    }
    const entry = statsMap.get(sid)!;
    entry.total++;
    if (b.status === "attended") entry.attended++;
    else if (b.status === "no_show") entry.no_show++;
    else if (b.status === "justified") entry.justified++;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${orgSlug}/dashboard/asistencia/${classId}`}
          className="text-sm text-muted-foreground hover:text-white"
        >
          ← Sesiones
        </Link>
        <h1 className="text-2xl font-semibold">
          Historial — {clase.name}
        </h1>
      </div>

      {!sessions?.length ? (
        <p className="text-muted-foreground">No hay sesiones registradas.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#1a1a2e]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a2e] bg-[#0d0d1a] text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Fecha
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Horario
                </th>
                <th className="px-4 py-3 font-medium text-green-400">
                  Presentes
                </th>
                <th className="px-4 py-3 font-medium text-red-400">
                  Ausentes
                </th>
                <th className="px-4 py-3 font-medium text-amber-400">
                  Justificados
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {(
                sessions as {
                  id: string;
                  session_date: string;
                  start_time: string;
                  end_time: string;
                  status: string;
                }[]
              ).map((s) => {
                const stats = statsMap.get(s.id) ?? {
                  attended: 0,
                  no_show: 0,
                  justified: 0,
                  total: 0,
                };
                return (
                  <tr
                    key={s.id}
                    className="border-b border-[#1a1a2e] hover:bg-[#0d0d1a]/50"
                  >
                    <td className="px-4 py-3 text-white">
                      {new Date(
                        s.session_date + "T12:00:00"
                      ).toLocaleDateString("es-EC", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {String(s.start_time).slice(0, 5)}–
                      {String(s.end_time).slice(0, 5)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-400">
                      {stats.attended}
                    </td>
                    <td className="px-4 py-3 font-semibold text-red-400">
                      {stats.no_show}
                    </td>
                    <td className="px-4 py-3 font-semibold text-amber-400">
                      {stats.justified}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {stats.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
