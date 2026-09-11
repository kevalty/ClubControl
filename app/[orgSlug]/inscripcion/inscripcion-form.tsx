"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { submitInscripcion } from "./actions";

type Location = { id: string; name: string };
type FeeType = { id: string; name: string; discount_percent: number };

export function InscripcionForm({
  orgSlug,
  orgId,
  locations,
  feeTypes,
}: {
  orgSlug: string;
  orgId: string;
  locations: Location[];
  feeTypes: FeeType[];
}) {
  const action = submitInscripcion.bind(null, orgSlug, orgId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [activeTab, setActiveTab] = useState("personales");

  if (state?.success) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="mb-2 text-4xl text-green-500">&#10003;</div>
        <h2 className="text-xl font-semibold">¡Solicitud enviada!</h2>
        <p className="mt-2 text-muted-foreground">
          Tu solicitud de inscripción fue recibida. El equipo la revisará y te
          contactará pronto.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <form action={formAction} className="space-y-6">
        {state?.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personales">Datos del estudiante</TabsTrigger>
            <TabsTrigger value="medico">Información médica</TabsTrigger>
            <TabsTrigger value="representante">Representante</TabsTrigger>
          </TabsList>

          {/* ===== TAB 1: DATOS DEL ESTUDIANTE ===== */}
          <TabsContent value="personales" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo *</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
                <Input id="birthDate" name="birthDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentId">Cédula</Label>
                <Input id="documentId" name="documentId" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school">Unidad educativa *</Label>
                <Input id="school" name="school" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Curso / Año *</Label>
                <Input id="grade" name="grade" required />
              </div>
            </div>
            {locations.length > 0 ? (
              <div className="space-y-2">
                <Label>Sede de entrenamiento</Label>
                <Select name="locationId">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sede (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {feeTypes.length > 0 ? (
              <div className="space-y-2">
                <Label>Tipo de tarifa</Label>
                <Select name="feeTypeId">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tarifa (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {feeTypes.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                        {f.discount_percent > 0
                          ? ` (${f.discount_percent}% desc.)`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </TabsContent>

          {/* ===== TAB 2: INFORMACIÓN MÉDICA ===== */}
          <TabsContent value="medico" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="bloodType">Tipo de sangre *</Label>
              <Select name="bloodType" required>
                <SelectTrigger id="bloodType">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergies">Alergias *</Label>
              <Textarea
                id="allergies"
                name="allergies"
                required
                placeholder="Ninguna / Penicilina / Polen..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditions">Condiciones médicas *</Label>
              <Textarea
                id="conditions"
                name="conditions"
                required
                placeholder="Ninguna / Asma / Diabetes..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medications">Medicamentos</Label>
              <Textarea
                id="medications"
                name="medications"
                placeholder="Ninguno / Salbutamol..."
              />
            </div>
          </TabsContent>

          {/* ===== TAB 3: REPRESENTANTE ===== */}
          <TabsContent value="representante" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="repFullName">Nombre completo *</Label>
              <Input id="repFullName" name="repFullName" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="repRelationship">Parentesco *</Label>
                <Input
                  id="repRelationship"
                  name="repRelationship"
                  required
                  placeholder="Padre / Madre / Tutor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repPhone">Teléfono *</Label>
                <Input
                  id="repPhone"
                  name="repPhone"
                  type="tel"
                  required
                  placeholder="0991234567"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="repEmail">Correo electrónico</Label>
                <Input id="repEmail" name="repEmail" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repDocumentId">Cédula</Label>
                <Input id="repDocumentId" name="repDocumentId" />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Enviando..." : "Enviar solicitud de inscripción"}
        </Button>
      </form>
    </div>
  );
}
