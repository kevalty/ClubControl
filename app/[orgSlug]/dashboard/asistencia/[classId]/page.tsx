import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

function getSessionStatus(
  sessionDate: string
): "abierto" | "cerrado" | "programado" {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (sessionDate === today || sessionDate === yesterday) return "abierto";
  if (sessionDate < yesterday) return "cerrado";
  return "programado";
}

const DAY_NAMES: Record<string, string> = {
  "0": "Dom",
  "1": "Lun",
  "2": "Mar",
  "3": "Mié",
  "4": "Jue",
  "5": "Vie",
  "6": "Sáb",
};

export default async function AsistenciaClaseSesionesPage({
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions } = await (supabase as any)
    .from("class_sessions")
    .select("id, session_date, start_time, end_time, status, auto_close_at")
    .eq("class_id", classId)
    .eq("organization_id", org.id)
    .order("session_date", { ascending: false })
    .limit(60);

  // Count bookings per session
  const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id);
  const { data: bookings } = await supabase
    .from("class_bookings")
    .select("class_session_id, status")
    .in(
      "class_session_id",
      sessionIds.length
        ? sessionIds
        : ["00000000-0000-0000-0000-000000000000"]
    );

  const bookingCountMap: Record<string, number> = {};
  for (const b of bookings ?? []) {
    bookingCountMap[b.class_session_id] =
      (bookingCountMap[b.class_session_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link
            href={`/${orgSlug}/dashboard/asistencia/clases`}
            className="text-sm text-muted-foreground hover:text-white"
          >
            ← Clases
          </Link>
          <h1 className="text-2xl font-semibold">{clase.name}</h1>
        </div>
        <Link
          href={`/${orgSlug}/dashboard/asistencia/${classId}/historial`}
          className="text-sm text-[#818cf8] hover:underline"
        >
          Ver historial completo →
        </Link>
      </div>

      {!sessions?.length ? (
        <p className="text-muted-foreground">No hay sesiones generadas aún.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map(
            (s: {
              id: string;
              session_date: string;
              start_time: string;
              end_time: string;
              auto_close_at: string | null;
            }) => {
              const sessionStatus = getSessionStatus(s.session_date);
              const bookingCount = bookingCountMap[s.id] ?? 0;
              const dayNum = new Date(
                s.session_date + "T12:00:00"
              )
                .getDay()
                .toString();
              return (
                <Link
                  key={s.id}
                  href={`/${orgSlug}/dashboard/asistencia/${classId}/${s.id}`}
                  className="flex items-center justify-between rounded-lg border border-[#1a1a2e] bg-[#0d0d1a] p-4 hover:border-[#6366f1]/40 transition-colors"
                >
                  <div>
                    <p className="font-medium text-white">
                      {DAY_NAMES[dayNum]}{" "}
                      {new Date(
                        s.session_date + "T12:00:00"
                      ).toLocaleDateString("es-EC", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.start_time}–{s.end_time} · {bookingCount} registros
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                      sessionStatus === "abierto"
                        ? "bg-green-500/15 text-green-400"
                        : sessionStatus === "cerrado"
                        ? "bg-[#1a1a2e] text-[#6b7280]"
                        : "bg-amber-500/15 text-amber-400"
                    )}
                  >
                    {sessionStatus === "abierto"
                      ? "Abierto"
                      : sessionStatus === "cerrado"
                      ? "Cerrado"
                      : "Programado"}
                  </span>
                </Link>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
