import { getCurrentMember } from "@/lib/portal/get-current-member";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReservaBoton } from "@/app/[orgSlug]/portal/clases/reserva-boton";

export default async function PortalClasesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { supabase, org, member } = await getCurrentMember(orgSlug);

  const hoy = new Date().toISOString().slice(0, 10);
  const en14dias = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [{ data: sesiones }, { data: misReservas }] = await Promise.all([
    supabase
      .from("class_sessions")
      .select("id, session_date, start_time, end_time, classes(name, capacity, location)")
      .eq("organization_id", org.id)
      .eq("status", "scheduled")
      .gte("session_date", hoy)
      .lte("session_date", en14dias)
      .order("session_date")
      .order("start_time"),
    supabase
      .from("class_bookings")
      .select("id, class_session_id, status")
      .eq("member_id", member.id)
      .eq("status", "booked"),
  ]);

  const sessionIds = (sesiones ?? []).map((s) => s.id);
  const { data: conteos } = sessionIds.length
    ? await supabase
        .from("class_bookings")
        .select("class_session_id")
        .in("class_session_id", sessionIds)
        .eq("status", "booked")
    : { data: [] };

  const reservasPorSesion = new Map<string, number>();
  for (const c of conteos ?? []) {
    reservasPorSesion.set(c.class_session_id, (reservasPorSesion.get(c.class_session_id) ?? 0) + 1);
  }
  const miReservaPorSesion = new Map(
    (misReservas ?? []).map((r) => [r.class_session_id, r.id])
  );

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Clases (próximos 14 días)</h1>
      {!sesiones || sesiones.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay clases programadas.</p>
      ) : (
        sesiones.map((s) => {
          const clase = s.classes as unknown as {
            name: string;
            capacity: number;
            location: string | null;
          } | null;
          const reservados = reservasPorSesion.get(s.id) ?? 0;
          const lleno = reservados >= (clase?.capacity ?? 0);
          const miReserva = miReservaPorSesion.get(s.id) ?? null;

          return (
            <Card key={s.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{clase?.name}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {reservados}/{clase?.capacity} cupos
                </span>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {s.session_date} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                  {clase?.location ? ` · ${clase.location}` : ""}
                </div>
                <ReservaBoton
                  orgSlug={orgSlug}
                  memberId={member.id}
                  sessionId={s.id}
                  bookingId={miReserva}
                  lleno={lleno}
                />
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
