import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function CalendarioClasesPage({
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

  const inicio = startOfWeek(new Date());
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 7);

  const { data: sesiones } = await supabase
    .from("class_sessions")
    .select("id, session_date, start_time, end_time, status, classes(name, capacity)")
    .eq("organization_id", org!.id)
    .gte("session_date", inicio.toISOString().slice(0, 10))
    .lt("session_date", fin.toISOString().slice(0, 10))
    .order("start_time");

  const dias = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Calendario de clases (esta semana)</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {dias.map((fecha, i) => {
          const sesionesDelDia = (sesiones ?? []).filter((s) => s.session_date === fecha);
          return (
            <Card key={fecha}>
              <CardHeader>
                <CardTitle className="text-sm">
                  {DIAS_SEMANA[i]} {fecha.slice(5)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sesionesDelDia.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin clases</p>
                ) : (
                  sesionesDelDia.map((s) => (
                    <Link
                      key={s.id}
                      href={`/${orgSlug}/dashboard/clases/sesiones/${s.id}`}
                      className="block rounded-md border p-2 text-xs hover:bg-muted"
                    >
                      <div className="font-medium">
                        {(s.classes as unknown as { name: string } | null)?.name}
                      </div>
                      <div className="text-muted-foreground">
                        {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
