import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// TODO: este es un panel mínimo. El dashboard con KPIs completo (recaudo,
// miembros activos, pagos pendientes, asistencia, próximos vencimientos) es
// el módulo 8.10 — se construye cuando existan pagos y asistencia con datos
// reales que graficar (CLAUDE.md no le asigna un número de fase explícito;
// ver PROGRESS.md).
export default async function DashboardHomePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link href={`/${orgSlug}/dashboard/miembros`}>
        <Card className="transition-colors hover:bg-muted/50">
          <CardHeader>
            <CardTitle>Miembros</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Registra y administra a los afiliados de tu club.
          </CardContent>
        </Card>
      </Link>
      <Link href={`/${orgSlug}/dashboard/planes`}>
        <Card className="transition-colors hover:bg-muted/50">
          <CardHeader>
            <CardTitle>Planes de membresía</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Crea y edita los planes que le vendes a tus miembros.
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
