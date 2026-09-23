import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AttendancePanel } from "@/app/[orgSlug]/dashboard/clases/sesiones/[sessionId]/attendance-panel";
import { marcarAsistencia } from "./actions";

export default async function AsistenciaSessionPage({
  params,
}: {
  params: Promise<{ orgSlug: string; classId: string; sessionId: string }>;
}) {
  const { orgSlug, classId, sessionId } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session } = await (supabase as any)
    .from("class_sessions")
    .select(
      "id, organization_id, class_id, session_date, start_time, end_time, auto_close_at, status"
    )
    .eq("id", sessionId)
    .eq("organization_id", org.id)
    .maybeSingle();

  if (!session) notFound();

  const { data: clase } = await supabase
    .from("classes")
    .select("id, name, capacity, location")
    .eq("id", classId)
    .eq("organization_id", org.id)
    .maybeSingle();

  if (!clase) notFound();

  const [{ data: bookings }, { data: enrollments }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("class_bookings")
      .select("id, status, member_id")
      .eq("class_session_id", sessionId)
      .order("booked_at"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("class_enrollments")
      .select("member_id, members(id, full_name)")
      .eq("class_id", classId)
      .eq("status", "active"),
  ]);

  // Map existing bookings by member_id
  const bookingByMember = new Map<
    string,
    "attended" | "no_show" | "justified" | "booked"
  >(
    (bookings ?? []).map(
      (b: {
        member_id: string;
        status: "attended" | "no_show" | "justified" | "booked";
      }) => [b.member_id as string, b.status]
    )
  );

  type EnrollmentRow = {
    member_id: string;
    members: { id: string; full_name: string } | null;
  };

  const attendanceMembers = ((enrollments ?? []) as EnrollmentRow[]).map(
    (e) => ({
      memberId: e.member_id,
      fullName: e.members?.full_name ?? "—",
      status: bookingByMember.get(e.member_id) ?? null,
    })
  );

  const marcarAction = marcarAsistencia.bind(
    null,
    orgSlug,
    sessionId,
    session.organization_id
  );

  const isSoftClosed =
    session.auto_close_at &&
    new Date(session.auto_close_at) < new Date();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${orgSlug}/dashboard/asistencia/${classId}`}
          className="text-sm text-muted-foreground hover:text-white"
        >
          ← {clase.name}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{clase.name}</h1>
        <p className="text-muted-foreground">
          {session.session_date} · {String(session.start_time).slice(0, 5)}–
          {String(session.end_time).slice(0, 5)}
          {clase.location ? ` · ${clase.location}` : ""}
        </p>
      </div>

      {isSoftClosed ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          Esta sesión ya cerró automáticamente. Puedes seguir registrando
          asistencia manualmente si es necesario.
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Registro de asistencia</h2>
        <p className="text-xs text-muted-foreground">
          Toca el botón para marcar la asistencia de cada alumno inscrito.
        </p>
        <AttendancePanel
          members={attendanceMembers}
          marcarAction={marcarAction}
        />
      </div>
    </div>
  );
}
