"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { aprobarInscripcion } from "./actions";

type FeeType = { id: string; name: string };
type Location = { id: string; name: string };
type Clase = { id: string; name: string };

export function AprobarModal({
  orgSlug,
  memberId,
  feeTypes,
  locations,
  clases,
  onDone,
}: {
  orgSlug: string;
  memberId: string;
  feeTypes: FeeType[];
  locations: Location[];
  clases: Clase[];
  onDone: (ok: boolean) => void;
}) {
  const [feeTypeId, setFeeTypeId] = useState<string>("none");
  const [locationId, setLocationId] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    if (!locationId) {
      setError("Selecciona una sede.");
      return;
    }
    if (!classId) {
      setError("Selecciona un horario / clase.");
      return;
    }
    setPending(true);
    setError("");
    const result = await aprobarInscripcion(
      orgSlug,
      memberId,
      feeTypeId === "none" ? null : feeTypeId,
      locationId,
      classId
    );
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onDone(true);
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label>Rubro / Tipo de tarifa</Label>
        <Select value={feeTypeId} onValueChange={setFeeTypeId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin rubro (tarifa normal)</SelectItem>
            {feeTypes.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>
          Sede <span className="text-destructive">*</span>
        </Label>
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona una sede..." />
          </SelectTrigger>
          <SelectContent>
            {locations.length === 0 ? (
              <SelectItem value="_none" disabled>
                No hay sedes creadas
              </SelectItem>
            ) : (
              locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>
          Horario / Clase <span className="text-destructive">*</span>
        </Label>
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona un horario..." />
          </SelectTrigger>
          <SelectContent>
            {clases.length === 0 ? (
              <SelectItem value="_none" disabled>
                No hay clases creadas
              </SelectItem>
            ) : (
              clases.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleConfirm} disabled={pending} className="flex-1">
          {pending ? "Aprobando..." : "Confirmar aprobación"}
        </Button>
        <Button
          variant="outline"
          onClick={() => onDone(false)}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
