import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { reservarCupo } from "@/app/[orgSlug]/dashboard/clases/sesiones/[sessionId]/actions";
import { ReservarForm } from "@/app/[orgSlug]/dashboard/clases/sesiones/[sessionId]/reservar-form";
import { BookingActions } from "@/app/[orgSlug]/dashboard/clases/sesiones/[sessionId]/booking-actions";

const BOOKING_STATUS_LABELS: Record<string, string> = {
  booked: "Reservado",
  attended: "Asistió",
  no_show: "No asistió",
  cancelled: "Cancelado",
};

export default async function SesionDetallePage({
  params,
}: {
  params: Promise<{ orgSlug: string; sessionId: string }>;
}) {
  const { orgSlug, sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("class_sessions")
    .select("id, organization_id, session_date, start_time, end_time, classes(name, capacity, location)")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    notFound();
  }

  const [{ data: bookings }, { data: miembros }] = await Promise.all([
    supabase
      .from("class_bookings")
      .select("id, status, members(id, full_name)")
      .eq("class_session_id", sessionId)
      .order("booked_at"),
    supabase
      .from("members")
      .select("id, full_name")
      .eq("organization_id", session.organization_id)
      .eq("status", "active")
      .order("full_name"),
  ]);

  const claseInfo = session.classes as unknown as {
    name: string;
    capacity: number;
    location: string | null;
  } | null;

  const reservados = (bookings ?? []).filter((b) => b.status === "booked").length;
  const action = reservarCupo.bind(null, orgSlug, sessionId, session.organization_id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{claseInfo?.name}</h1>
        <p className="text-muted-foreground">
          {session.session_date} · {session.start_time.slice(0, 5)}–{session.end_time.slice(0, 5)}
          {claseInfo?.location ? ` · ${claseInfo.location}` : ""}
        </p>
        <p className="text-sm text-muted-foreground">
          {reservados} / {claseInfo?.capacity} cupos reservados
        </p>
      </div>

      <ReservarForm action={action} miembros={miembros ?? []} />

      {!bookings || bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay reservas.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    {(b.members as unknown as { full_name: string } | null)?.full_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.status === "attended" ? "default" : "secondary"}>
                      {BOOKING_STATUS_LABELS[b.status] ?? b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <BookingActions orgSlug={orgSlug} sessionId={sessionId} bookingId={b.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
