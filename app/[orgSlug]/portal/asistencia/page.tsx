import { getCurrentMember } from "@/lib/portal/get-current-member";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function PortalAsistenciaPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { supabase, member } = await getCurrentMember(orgSlug);

  const { data: asistencias } = await supabase
    .from("attendance")
    .select("checked_in_at, method")
    .eq("member_id", member.id)
    .order("checked_in_at", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Mi historial de asistencia</h1>
      {!asistencias || asistencias.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no tienes check-ins registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asistencias.map((a, i) => {
                const fecha = new Date(a.checked_in_at);
                return (
                  <TableRow key={i}>
                    <TableCell>{fecha.toLocaleDateString("es-EC")}</TableCell>
                    <TableCell>{fecha.toLocaleTimeString("es-EC")}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
