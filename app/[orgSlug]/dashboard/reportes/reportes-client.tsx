"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReporteIngresos } from "./reporte-ingresos";
import { ReporteInscripciones } from "./reporte-inscripciones";
import { ReporteAsistencia } from "./reporte-asistencia";

export function ReportesClient({
  orgId,
  clases,
}: {
  orgId: string;
  clases: { id: string; name: string }[];
}) {
  return (
    <Tabs defaultValue="ingresos" className="space-y-4">
      <TabsList>
        <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
        <TabsTrigger value="inscripciones">Inscripciones</TabsTrigger>
        <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
      </TabsList>
      <TabsContent value="ingresos" className="rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] p-6">
        <ReporteIngresos orgId={orgId} />
      </TabsContent>
      <TabsContent value="inscripciones" className="rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] p-6">
        <ReporteInscripciones orgId={orgId} />
      </TabsContent>
      <TabsContent value="asistencia" className="rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] p-6">
        <ReporteAsistencia orgId={orgId} clases={clases} />
      </TabsContent>
    </Tabs>
  );
}
