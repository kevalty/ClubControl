"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { exportarAsistencia } from "./actions";

export function ReporteAsistencia({ orgId, clases }: { orgId: string; clases: { id: string; name: string }[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 7) + "-01";
  const [classId, setClassId] = useState(clases[0]?.id ?? "");
  const [desde, setDesde] = useState(firstOfMonth);
  const [hasta, setHasta] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    if (!classId) { setError("Selecciona una clase."); return; }
    setLoading(true);
    setError("");
    const result = await exportarAsistencia(orgId, classId, desde, hasta);
    setLoading(false);
    if ("error" in result) { setError(result.error); return; }
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asistencia-${desde}-${hasta}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Clase</Label>
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecciona una clase" />
          </SelectTrigger>
          <SelectContent>
            {clases.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <Label>Desde</Label>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Hasta</Label>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button onClick={handleExport} disabled={loading || !classId}>
        {loading ? "Generando..." : "Exportar CSV"}
      </Button>
      <p className="text-xs text-muted-foreground">El archivo se abre en Excel o Google Sheets.</p>
    </div>
  );
}
