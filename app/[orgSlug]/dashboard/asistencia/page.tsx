import { createClient } from "@/lib/supabase/server";
import { registrarAsistenciaManual } from "@/app/[orgSlug]/dashboard/asistencia/actions";
import { RegistrarAsistenciaForm } from "@/app/[orgSlug]/dashboard/asistencia/registrar-form";
import { AsistenciaCharts } from "@/app/[orgSlug]/dashboard/asistencia/asistencia-charts";
import { LinkButton } from "@/components/ui/link-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AsistenciaPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  const desde = new Date();
  desde.setDate(desde.getDate() - 30);

  const [{ data: miembros }, { data: asistencias }] = await Promise.all([
    supabase
      .from("members")
      .select("id, full_name")
      .eq("organization_id", org!.id)
      .eq("status", "active")
      .order("full_name"),
    supabase
      .from("attendance")
      .select("checked_in_at, member_id, members(full_name)")
      .eq("organization_id", org!.id)
      .gte("checked_in_at", desde.toISOString())
      .order("checked_in_at", { ascending: false }),
  ]);

  const registros = asistencias ?? [];

  // Check-ins por día (últimos 14 días).
  const porDiaMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    porDiaMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of registros) {
    const fecha = r.checked_in_at.slice(0, 10);
    if (porDiaMap.has(fecha)) {
      porDiaMap.set(fecha, (porDiaMap.get(fecha) ?? 0) + 1);
    }
  }
  const porDia = Array.from(porDiaMap.entries()).map(([fecha, total]) => ({
    fecha: fecha.slice(5), // MM-DD
    total,
  }));

  // Horas pico.
  const porHoraMap = new Map<number, number>();
  for (let h = 0; h < 24; h++) porHoraMap.set(h, 0);
  for (const r of registros) {
    const hora = new Date(r.checked_in_at).getHours();
    porHoraMap.set(hora, (porHoraMap.get(hora) ?? 0) + 1);
  }
  const porHora = Array.from(porHoraMap.entries())
    .filter(([hora]) => hora >= 5 && hora <= 23) // horario típico de un club
    .map(([hora, total]) => ({ hora: `${hora}:00`, total }));

  // Ranking de asistencia.
  const rankingMap = new Map<string, { nombre: string; total: number }>();
  for (const r of registros) {
    const nombre = (r.members as unknown as { full_name: string } | null)?.full_name ?? "—";
    const actual = rankingMap.get(r.member_id) ?? { nombre, total: 0 };
    actual.total++;
    rankingMap.set(r.member_id, actual);
  }
  const ranking = Array.from(rankingMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const action = registrarAsistenciaManual.bind(null, orgSlug, org!.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Asistencia</h1>
        <LinkButton href={`/${orgSlug}/checkin`} target="_blank" variant="outline">
          Abrir modo kiosco
        </LinkButton>
      </div>

      <RegistrarAsistenciaForm action={action} miembros={miembros ?? []} />

      <AsistenciaCharts porDia={porDia} porHora={porHora} />

      <div>
        <h2 className="mb-3 text-lg font-medium">
          Ranking de asistencia (últimos 30 días)
        </h2>
        {ranking.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos todavía.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead className="text-right">Check-ins</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.nombre}</TableCell>
                    <TableCell className="text-right">{r.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
