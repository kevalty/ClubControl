"use client";

import { useActionState, useState, useEffect } from "react";
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

type Tab = "personales" | "medico" | "representante";

const TABS: Tab[] = ["personales", "medico", "representante"];
const TAB_LABELS: Record<Tab, string> = {
  personales: "Datos del estudiante",
  medico: "Información médica",
  representante: "Representante",
};

function getErrorTab(error: string): Tab {
  if (error.includes("médica") || error.includes("sangre") || error.includes("lergias") || error.includes("ondiciones")) return "medico";
  if (error.includes("Representante") || error.includes("representante") || error.includes("arentesco") || error.includes("eléfono del")) return "representante";
  return "personales";
}

export function InscripcionForm({
  orgSlug,
  orgId,
  locations,
  feeTypes,
  studentName,
}: {
  orgSlug: string;
  orgId: string;
  locations: Location[];
  feeTypes: FeeType[];
  studentName?: string;
}) {
  const action = submitInscripcion.bind(null, orgSlug, orgId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [activeTab, setActiveTab] = useState<Tab>("personales");
  const [errorTab, setErrorTab] = useState<Tab | null>(null);

  // Cuando llega un error, navegar al tab que lo contiene
  useEffect(() => {
    if (state?.error) {
      const tab = getErrorTab(state.error);
      setErrorTab(tab);
      setActiveTab(tab);
    }
  }, [state?.error]);

  if (state?.success) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center space-y-3">
        <div className="text-5xl text-green-500">✓</div>
        <h2 className="text-xl font-semibold">¡Solicitud enviada correctamente!</h2>
        <p className="text-muted-foreground">
          Recibimos la solicitud de inscripción
          {studentName ? <> para <span className="font-semibold">{studentName}</span></> : null}.{" "}
          El equipo la revisará y se pondrán en contacto contigo pronto.
        </p>
      </div>
    );
  }

  const currentIndex = TABS.indexOf(activeTab);

  return (
    <div className="rounded-lg border bg-card p-6">
      <form action={formAction} className="space-y-5">
        {state?.error ? (
          <Alert variant="destructive">
            <AlertDescription className="space-y-1">
              <p className="font-medium">Por favor completa lo siguiente antes de enviar:</p>
              <p>{state.error}</p>
              <button
                type="button"
                className="underline text-xs"
                onClick={() => setActiveTab(errorTab ?? getErrorTab(state.error!))}
              >
                Ir al campo →
              </button>
            </AlertDescription>
          </Alert>
        ) : null}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
          <TabsList className="grid w-full grid-cols-3">
            {TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="relative text-xs sm:text-sm">
                {TAB_LABELS[tab]}
                {errorTab === tab ? (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background" />
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ===== TAB 1: DATOS DEL ESTUDIANTE ===== */}
          <TabsContent forceMount value="personales" className="space-y-4 pt-4 data-[state=inactive]:hidden">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo del estudiante *</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={studentName}
                required
                placeholder="Nombres y apellidos completos"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
                <Input id="birthDate" name="birthDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentId">Cédula del estudiante</Label>
                <Input id="documentId" name="documentId" placeholder="Opcional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school">Unidad educativa *</Label>
                <Input id="school" name="school" required placeholder="Nombre del colegio o escuela" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Curso / Año *</Label>
                <Input id="grade" name="grade" required placeholder="Ej: 8vo A" />
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
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
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
                        {f.name}{f.discount_percent > 0 ? ` (${f.discount_percent}% desc.)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="flex justify-end pt-2">
              <Button type="button" onClick={() => setActiveTab("medico")}>
                Siguiente: Información médica →
              </Button>
            </div>
          </TabsContent>

          {/* ===== TAB 2: INFORMACIÓN MÉDICA ===== */}
          <TabsContent forceMount value="medico" className="space-y-4 pt-4 data-[state=inactive]:hidden">
            <p className="text-xs text-muted-foreground">
              Esta información es necesaria para la seguridad del estudiante durante los entrenamientos.
            </p>
            <div className="space-y-2">
              <Label htmlFor="bloodType">Tipo de sangre *</Label>
              <Select name="bloodType">
                <SelectTrigger id="bloodType">
                  <SelectValue placeholder="Selecciona el tipo de sangre" />
                </SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergies">Alergias *</Label>
              <Textarea
                id="allergies"
                name="allergies"
                required
                placeholder="Escribe 'Ninguna' si no tiene alergias conocidas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditions">Condiciones médicas *</Label>
              <Textarea
                id="conditions"
                name="conditions"
                required
                placeholder="Escribe 'Ninguna' si no tiene condiciones médicas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medications">Medicamentos que toma</Label>
              <Textarea
                id="medications"
                name="medications"
                placeholder="Escribe 'Ninguno' si no toma medicamentos"
              />
            </div>
            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setActiveTab("personales")}>
                ← Anterior
              </Button>
              <Button type="button" onClick={() => setActiveTab("representante")}>
                Siguiente: Representante →
              </Button>
            </div>
          </TabsContent>

          {/* ===== TAB 3: REPRESENTANTE ===== */}
          <TabsContent forceMount value="representante" className="space-y-4 pt-4 data-[state=inactive]:hidden">
            <p className="text-xs text-muted-foreground">
              Datos de la persona responsable del estudiante (padre, madre o tutor).
            </p>
            <div className="space-y-2">
              <Label htmlFor="repFullName">Nombre completo del representante *</Label>
              <Input id="repFullName" name="repFullName" required placeholder="Nombres y apellidos" />
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
                <Label htmlFor="repPhone">Teléfono / WhatsApp *</Label>
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
                <Input id="repEmail" name="repEmail" type="email" placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repDocumentId">Cédula del representante</Label>
                <Input id="repDocumentId" name="repDocumentId" placeholder="Opcional" />
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setActiveTab("medico")}>
                ← Anterior
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Indicador de progreso */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          {TABS.map((tab, i) => (
            <span key={tab} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`h-2 w-2 rounded-full transition-colors ${activeTab === tab ? "bg-primary" : "bg-muted-foreground/30"}`}
              />
              {i < TABS.length - 1 && <span className="h-px w-6 bg-muted-foreground/20" />}
            </span>
          ))}
        </div>

        <Button type="submit" disabled={pending} className="w-full" size="lg">
          {pending ? "Enviando solicitud..." : "Enviar solicitud de inscripción"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Al enviar confirmas que los datos proporcionados son correctos.
          Un miembro del equipo revisará tu solicitud y se pondrá en contacto contigo.
        </p>
      </form>
    </div>
  );
}
