"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Paleta accesible: un solo color por serie (no se usa color como único
// diferenciador entre series distintas — cada gráfica tiene una sola serie).
const BAR_COLOR = "#0EA5E9";

export function AsistenciaCharts({
  porDia,
  porHora,
}: {
  porDia: { fecha: string; total: number }[];
  porHora: { hora: string; total: number }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Check-ins por día (últimos 14 días)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {porDia.every((d) => d.total === 0) ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Todavía no hay check-ins registrados.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porDia}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horas pico</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {porHora.every((h) => h.total === 0) ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Todavía no hay check-ins registrados.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porHora}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
